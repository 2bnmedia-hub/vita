-- V-FORM NUTRITION — product-scoped fixed-amount coupons + NIMRY21
-- Applied to project uixfwazfrtcakzeghgml on 2026-10-14. Safe to re-run.
-- Run after supabase-coupons-migration.sql.

-- A coupon is now either percent_off or amount_off, optionally limited to one
-- product with a minimum quantity of that product in the cart.
-- max_redemptions null = unlimited (no reservation slot is used).
alter table public.coupons
  alter column percent_off drop not null,
  alter column max_redemptions drop not null,
  add column if not exists amount_off    numeric(10,2) check (amount_off > 0),
  add column if not exists product_id    uuid references public.products(id),
  add column if not exists min_quantity  integer not null default 1 check (min_quantity >= 1),
  add column if not exists terms_message text;

alter table public.coupons drop constraint if exists coupons_one_discount;
alter table public.coupons add constraint coupons_one_discount
  check ((percent_off is null) <> (amount_off is null));

-- Same as before, plus: an unlimited coupon needs no reservation.
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
  if v_coupon.max_redemptions is null then
    return 'ok';
  end if;
  if v_coupon.redeemed_count >= v_coupon.max_redemptions then
    return 'redeemed';
  end if;

  if v_coupon.reserved_order_id is not null and v_coupon.reserved_order_id is distinct from p_order_id then
    select * into v_holder from public.orders where id = v_coupon.reserved_order_id;
    if found then
      if v_holder.payment_status in ('payment_failed', 'failed', 'cancelled') then
        null;
      elsif v_holder.payment_status = 'pending'
            and coalesce(v_holder.payment_attempts, 0) = 0
            and v_coupon.reserved_at < now() - interval '60 minutes' then
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

-- Retire Nimry15. The row stays so past orders keep their coupon history.
update public.coupons set active = false where code = 'nimry15';

-- NIMRY21: 155 ₪ off (one box) when the cart holds 3+ boxes of
-- "קריאטין טבליות לעיסה" (slug creatine-chewable). Unlimited orders.
insert into public.coupons (code, amount_off, product_id, min_quantity, max_redemptions, terms_message)
values ('nimry21', 155, '88c99155-29a8-42aa-85fa-d7f05eba4fcb', 3, null,
        'הקופון תקף ברכישת 3 קופסאות קריאטין טבליות לעיסה לפחות')
on conflict (code) do update set
  amount_off = excluded.amount_off, percent_off = null, product_id = excluded.product_id,
  min_quantity = excluded.min_quantity, max_redemptions = null,
  terms_message = excluded.terms_message, active = true;
