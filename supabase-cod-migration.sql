-- V-FORM NUTRITION — cash on delivery ("תשלום לשליח")
-- Run after supabase-tranzila-migration.sql and supabase-coupons-*.sql.
-- Safe to re-run (idempotent).
--
-- A COD order is a real order that is NOT paid yet:
--   payment_method = 'cod', payment_status = 'cod_pending'.
-- Unlike a card order (stock taken only once Tranzila confirms the charge),
-- a COD order goes straight to fulfillment, so its stock and coupon are taken
-- when it is placed and given back if it is cancelled before payment.
-- Only an admin can mark the money as received (mark_cod_paid).

alter table public.orders
  add column if not exists payment_method   text not null default 'card',
  add column if not exists stock_allocated  boolean not null default false,
  add column if not exists cod_collected_at timestamptz,
  add column if not exists cod_collected_by text;

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('card', 'cod'));

-- COD is delivery-only; a COD order can never carry a Tranzila payment state.
alter table public.orders drop constraint if exists orders_cod_status_check;
alter table public.orders add constraint orders_cod_status_check
  check (payment_method = 'card' or payment_status in ('cod_pending', 'paid', 'cancelled'));

-- ── Only the server may create or change COD state ──
-- Checkout inserts through the service role and the RPCs below run as their
-- owner, so a request made with the public anon key (PostgREST switches to
-- the anon/authenticated role) can never forge a COD order, flip
-- stock_allocated to make a cancel inflate stock, or fake a collection record.
create or replace function public.guard_orders_cod_fields() returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') and (
       new.payment_method = 'cod' or new.stock_allocated or new.cod_collected_at is not null or new.cod_collected_by is not null
       or (tg_op = 'UPDATE' and (
            new.payment_method is distinct from old.payment_method
         or new.items is distinct from old.items and old.payment_method = 'cod')))
  then
    raise exception 'COD order fields can only be written by the server';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_orders_cod_fields on public.orders;
create trigger trg_guard_orders_cod_fields
before insert or update on public.orders
for each row execute function public.guard_orders_cod_fields();

-- ── Take stock (and the coupon) for a freshly inserted COD order ──
-- Returns 'ok' or 'insufficient_stock'. All-or-nothing: if one product is
-- short, nothing is decremented. Row locks on products serialize parallel orders.
create or replace function public.allocate_cod_order(p_order_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item  jsonb;
  v_qty   integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.payment_method <> 'cod' or v_order.payment_status <> 'cod_pending' then
    return 'invalid_order';
  end if;
  if v_order.stock_allocated then
    return 'ok';
  end if;

  begin
    for v_item in select * from jsonb_array_elements(v_order.items)
    loop
      v_qty := coalesce((v_item->>'quantity')::integer, 1);
      update public.products
        set stock_quantity = stock_quantity - v_qty
        where id = (v_item->>'product_id')::uuid
          and stock_quantity is not null;
      if exists (select 1 from public.products where id = (v_item->>'product_id')::uuid and stock_quantity < 0) then
        raise exception 'insufficient_stock';
      end if;
    end loop;
  exception when raise_exception then
    return 'insufficient_stock';
  end;

  update public.orders set stock_allocated = true where id = p_order_id;

  -- Same bookkeeping confirm_tranzila_payment() does for a paid card order.
  if v_order.coupon_code is not null then
    update public.coupons set
      redeemed_count    = redeemed_count + 1,
      redeemed_order_id = p_order_id,
      redeemed_at       = now(),
      reserved_order_id = case when reserved_order_id = p_order_id then null else reserved_order_id end
    where code = v_order.coupon_code;
  end if;

  return 'ok';
end;
$$;

-- ── Cancel an unpaid COD order: give back stock and the coupon, exactly once ──
create or replace function public.cancel_cod_order(p_order_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item  jsonb;
  v_qty   integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.payment_method <> 'cod' or v_order.payment_status <> 'cod_pending' then
    return false;
  end if;

  if v_order.stock_allocated then
    for v_item in select * from jsonb_array_elements(v_order.items)
    loop
      v_qty := coalesce((v_item->>'quantity')::integer, 1);
      update public.products
        set stock_quantity = stock_quantity + v_qty
        where id = (v_item->>'product_id')::uuid
          and stock_quantity is not null;
    end loop;

    if v_order.coupon_code is not null then
      update public.coupons set
        redeemed_count    = greatest(redeemed_count - 1, 0),
        redeemed_order_id = case when redeemed_order_id = p_order_id then null else redeemed_order_id end,
        redeemed_at       = case when redeemed_order_id = p_order_id then null else redeemed_at end
      where code = v_order.coupon_code;
    end if;
  end if;

  update public.orders set
    payment_status     = 'cancelled',
    status             = 'cancelled',
    stock_allocated    = false,
    last_payment_error = p_reason
  where id = p_order_id;
  return true;
end;
$$;

-- ── Admin confirms the courier collected the money ──
create or replace function public.mark_cod_paid(p_order_id uuid, p_admin_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if coalesce(trim(p_admin_email), '') = '' then
    return false;
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.payment_method <> 'cod' or v_order.payment_status <> 'cod_pending' then
    return false;
  end if;

  perform set_config('app.allow_payment_transition', '1', true);

  update public.orders set
    payment_status   = 'paid',
    paid_at          = now(),
    cod_collected_at = now(),
    cod_collected_by = p_admin_email
  where id = p_order_id;
  return true;
end;
$$;

-- Server (service role) only — never callable with the public anon key.
revoke all on function public.allocate_cod_order(uuid)       from public, anon, authenticated;
revoke all on function public.cancel_cod_order(uuid, text)   from public, anon, authenticated;
revoke all on function public.mark_cod_paid(uuid, text)      from public, anon, authenticated;
grant execute on function public.allocate_cod_order(uuid)     to service_role;
grant execute on function public.cancel_cod_order(uuid, text) to service_role;
grant execute on function public.mark_cod_paid(uuid, text)    to service_role;
