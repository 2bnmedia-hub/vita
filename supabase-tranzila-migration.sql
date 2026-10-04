-- V-FORM NUTRITION — Tranzila payment integration migration
-- Already applied to project uixfwazfrtcakzeghgml via the Supabase MCP.
-- Kept here so the schema is reproducible / reviewable. Safe to re-run:
-- every statement is idempotent (IF NOT EXISTS / OR REPLACE).

-- ── orders: fill gaps in the existing payment columns ──
alter table public.orders
  add column if not exists order_number         text,
  add column if not exists city                  text,
  add column if not exists zip                   text,
  add column if not exists payment_method_brand  text,
  add column if not exists card_last4            text,
  add column if not exists installments          integer,
  add column if not exists refunded_amount       numeric(10,2) not null default 0;

create unique index if not exists idx_orders_order_number
  on public.orders (order_number) where order_number is not null;

create unique index if not exists idx_orders_idempotency_key
  on public.orders (idempotency_key) where idempotency_key is not null;

-- ── products: optional per-unit stock tracking. NULL = unlimited (preserves current behavior). ──
alter table public.products
  add column if not exists stock_quantity integer;

-- ── webhook dedupe: each Tranzila transaction_id processed by the notify callback exactly once ──
create table if not exists public.payment_webhook_events (
  id              uuid primary key default gen_random_uuid(),
  transaction_id  text not null,
  order_id        uuid references public.orders(id),
  received_at     timestamptz not null default now()
);

create unique index if not exists idx_webhook_events_txn
  on public.payment_webhook_events (transaction_id);

alter table public.payment_webhook_events enable row level security;

-- ── Shared secret gating the RPCs below ──────────────────────────────────
-- Supabase's managed Postgres role cannot run `alter database ... set` for a
-- custom GUC (permission denied — that needs actual superuser), so the
-- gate secret lives in this locked-down table instead. RLS is enabled with
-- ZERO policies, so anon/authenticated get no access to it at all; the
-- SECURITY DEFINER functions below are owned by the same role that created
-- this table and therefore bypass RLS on it by default.
create table if not exists public.app_secrets (
  key   text primary key,
  value text not null
);
alter table public.app_secrets enable row level security;

-- Populate it once (and again on rotation) with the value from
-- TRANZILA_WEBHOOK_SECRET in .env.local / Vercel env — deliberately not
-- inlined here so this file stays safe to commit/share:
--   insert into public.app_secrets (key, value) values ('tranzila_rpc_secret', 'PASTE_VALUE')
--   on conflict (key) do update set value = excluded.value;

-- ── SECURITY: block direct forgery of payment_status via the open REST API ──
-- `orders` has RLS policies defined but RLS was never enabled on the table
-- in production, so any anon REST call could otherwise PATCH payment_status
-- straight to 'paid'/'refunded' without ever going through Tranzila.
-- Enabling full RLS would break the admin panel (it reads/writes orders
-- directly with the anon key; there's no Supabase-Auth-based admin role to
-- write policies against), so instead this trigger blocks payment_status
-- ever moving into a "money received/returned" state unless the verified
-- RPC functions below explicitly allow it for that one statement.
create or replace function public.guard_orders_payment_status() returns trigger
language plpgsql
as $$
begin
  if new.payment_status is distinct from old.payment_status
     and new.payment_status in ('paid', 'refunded', 'partially_refunded')
     and coalesce(current_setting('app.allow_payment_transition', true), '') <> '1' then
    raise exception 'payment_status can only move to % via the verified Tranzila RPC path', new.payment_status;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_orders_payment_status on public.orders;
create trigger trg_guard_orders_payment_status
before update on public.orders
for each row execute function public.guard_orders_payment_status();

-- ── Atomic, idempotent "mark paid" — the only path allowed to flip an order to paid ──
create or replace function public.confirm_tranzila_payment(
  p_secret          text,
  p_order_id        uuid,
  p_transaction_id  text,
  p_auth_number     text,
  p_amount          numeric,
  p_currency        text,
  p_card_brand      text,
  p_last4           text,
  p_installments    integer,
  p_env             text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order   public.orders%rowtype;
  v_claimed boolean;
  v_item    jsonb;
  v_qty     integer;
  v_secret  text;
begin
  select value into v_secret from public.app_secrets where key = 'tranzila_rpc_secret';
  if v_secret is null or p_secret is null or p_secret <> v_secret then
    return false;
  end if;

  -- Claim the webhook/verification event first: if this transaction_id was
  -- already processed, this insert fails on the unique index and we no-op.
  begin
    insert into public.payment_webhook_events (transaction_id, order_id)
    values (p_transaction_id, p_order_id);
    v_claimed := true;
  exception when unique_violation then
    v_claimed := false;
  end;

  if not v_claimed then
    return false;
  end if;

  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    return false;
  end if;

  -- Only a pending order can be confirmed, and only if the amount Tranzila
  -- actually charged matches what we computed server-side at order creation.
  if v_order.payment_status <> 'pending' or round(v_order.total, 2) <> round(p_amount, 2) then
    return false;
  end if;

  perform set_config('app.allow_payment_transition', '1', true);

  update public.orders set
    payment_status         = 'paid',
    tranzila_transaction_id = p_transaction_id,
    tranzila_confirmation_code = p_auth_number,
    payment_method_brand   = p_card_brand,
    card_last4             = p_last4,
    installments           = p_installments,
    currency                = coalesce(p_currency, v_order.currency),
    payment_env             = p_env,
    payment_provider        = 'tranzila',
    paid_at                 = now()
  where id = p_order_id;

  -- Decrement stock exactly once, only for products that track numeric stock.
  for v_item in select * from jsonb_array_elements(v_order.items)
  loop
    v_qty := coalesce((v_item->>'quantity')::integer, 1);
    update public.products
      set stock_quantity = greatest(stock_quantity - v_qty, 0)
      where id = (v_item->>'product_id')::uuid
        and stock_quantity is not null;
  end loop;

  -- Coupon (see supabase-coupons-migration.sql): a redemption is counted only
  -- here, i.e. only once the payment is verified. Runs at most once per order
  -- because only a 'pending' order gets this far, so a repeated notification
  -- can never count a second redemption. Refunds never give it back.
  if v_order.coupon_code is not null then
    update public.coupons set
      redeemed_count    = redeemed_count + 1,
      redeemed_order_id = p_order_id,
      redeemed_at       = now(),
      reserved_order_id = case when reserved_order_id = p_order_id then null else reserved_order_id end
    where code = v_order.coupon_code;
  end if;

  return true;
end;
$$;

-- ── Mark a failed/declined attempt without ever touching a paid order ──
create or replace function public.mark_tranzila_payment_failed(
  p_secret   text,
  p_order_id uuid,
  p_error    text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  select value into v_secret from public.app_secrets where key = 'tranzila_rpc_secret';
  if v_secret is null or p_secret is null or p_secret <> v_secret then
    return;
  end if;

  update public.orders set
    payment_status      = 'payment_failed',
    payment_attempts    = coalesce(payment_attempts, 0) + 1,
    last_payment_error  = p_error
  where id = p_order_id and payment_status = 'pending';
end;
$$;

-- ── Admin-triggered refund/cancel bookkeeping (the actual Tranzila credit call happens server-side first) ──
create or replace function public.record_tranzila_refund(
  p_secret      text,
  p_order_id    uuid,
  p_amount      numeric,
  p_full        boolean,
  p_auth_number text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order  public.orders%rowtype;
  v_item   jsonb;
  v_qty    integer;
  v_secret text;
begin
  select value into v_secret from public.app_secrets where key = 'tranzila_rpc_secret';
  if v_secret is null or p_secret is null or p_secret <> v_secret then
    return;
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.payment_status not in ('paid', 'partially_refunded') then
    return;
  end if;

  perform set_config('app.allow_payment_transition', '1', true);

  update public.orders set
    payment_status    = case when p_full then 'refunded' else 'partially_refunded' end,
    refunded_amount   = v_order.refunded_amount + p_amount,
    last_payment_error = 'refund auth ' || coalesce(p_auth_number, '')
  where id = p_order_id;

  if p_full then
    for v_item in select * from jsonb_array_elements(v_order.items)
    loop
      v_qty := coalesce((v_item->>'quantity')::integer, 1);
      update public.products
        set stock_quantity = stock_quantity + v_qty
        where id = (v_item->>'product_id')::uuid
          and stock_quantity is not null;
    end loop;
  end if;
end;
$$;

grant execute on function public.confirm_tranzila_payment       to anon, authenticated;
grant execute on function public.mark_tranzila_payment_failed   to anon, authenticated;
grant execute on function public.record_tranzila_refund         to anon, authenticated;
