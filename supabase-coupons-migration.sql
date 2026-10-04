-- V-FORM NUTRITION — coupons
-- Applied to project uixfwazfrtcakzeghgml. Safe to re-run (idempotent).
-- Run BEFORE re-running supabase-tranzila-migration.sql, whose
-- confirm_tranzila_payment() counts the redemption.

create table if not exists public.coupons (
  code              text primary key check (code = lower(code)),
  percent_off       integer not null check (percent_off between 1 and 100),
  max_redemptions   integer not null default 1,
  redeemed_count    integer not null default 0,
  active            boolean not null default true,
  reserved_order_id uuid references public.orders(id),
  reserved_at       timestamptz,
  redeemed_order_id uuid references public.orders(id),
  redeemed_at       timestamptz,
  created_at        timestamptz not null default now()
);
-- RLS on with zero policies: only the service role (server) can touch it.
alter table public.coupons enable row level security;

alter table public.orders
  add column if not exists coupon_code     text,
  add column if not exists discount_amount numeric(10,2) not null default 0;

-- Atomic check-and-reserve. Returns 'ok' | 'invalid' | 'redeemed' | 'reserved'.
-- p_order_id null = availability check only (nothing is written).
-- The row lock makes two simultaneous checkouts serialize: exactly one order
-- can hold the coupon while its payment is in progress.
-- A reservation is given up only when its order can no longer be charged:
-- the order is failed/cancelled, or it never sent a charge (payment_attempts
-- = 0) and is 60 minutes old — Tranzila's handshake token dies after 20, so
-- no approval for it can still arrive. An order whose charge is "in review"
-- (payment_attempts > 0) keeps the coupon until a human resolves it.
-- ponytail: one reservation slot per coupon; if a coupon ever needs
-- max_redemptions > 1 with parallel checkouts, move reservations to a table.
create or replace function public.reserve_coupon(p_code text, p_order_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon public.coupons%rowtype;
  v_holder public.orders%rowtype;
begin
  select * into v_coupon from public.coupons where code = lower(trim(p_code)) for update;
  if not found or not v_coupon.active then
    return 'invalid';
  end if;
  if v_coupon.redeemed_count >= v_coupon.max_redemptions then
    return 'redeemed';
  end if;

  if v_coupon.reserved_order_id is not null and v_coupon.reserved_order_id is distinct from p_order_id then
    select * into v_holder from public.orders where id = v_coupon.reserved_order_id;
    if found then
      if v_holder.payment_status in ('payment_failed', 'failed', 'cancelled') then
        null; -- holder is dead, reservation is free
      elsif v_holder.payment_status = 'pending'
            and coalesce(v_holder.payment_attempts, 0) = 0
            and v_coupon.reserved_at < now() - interval '60 minutes' then
        -- Abandoned checkout. Close it so it can never be paid at the
        -- discounted price after the coupon moved on.
        if p_order_id is not null then
          update public.orders
            set payment_status = 'payment_failed', last_payment_error = 'coupon_reservation_expired'
            where id = v_holder.id and payment_status = 'pending';
        end if;
      else
        return 'reserved';
      end if;
    end if;
  end if;

  if p_order_id is not null then
    update public.coupons set reserved_order_id = p_order_id, reserved_at = now() where code = v_coupon.code;
  end if;
  return 'ok';
end;
$$;

revoke all on function public.reserve_coupon(text, uuid) from public, anon, authenticated;
grant execute on function public.reserve_coupon(text, uuid) to service_role;

-- Nimry15: 15% off the products subtotal (shipping excluded), one redemption site-wide.
insert into public.coupons (code, percent_off, max_redemptions)
values ('nimry15', 15, 1)
on conflict (code) do nothing;
