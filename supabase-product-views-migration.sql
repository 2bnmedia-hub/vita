-- Count unique product views once per visitor per product per UTC day.
create table if not exists public.product_views (
  product_id uuid not null references public.products(id) on delete cascade,
  visitor_id text not null,
  viewed_on date not null default (timezone('utc', now()))::date,
  created_at timestamptz not null default now(),
  primary key (product_id, visitor_id, viewed_on)
);

alter table public.product_views enable row level security;
revoke all on public.product_views from public, anon, authenticated;
grant select, insert, delete on public.product_views to service_role;

create or replace function public.record_product_view(p_product_id uuid, p_visitor_id text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.product_views (product_id, visitor_id, viewed_on)
  select p_product_id, p_visitor_id, (timezone('utc', now()))::date
  where exists (select 1 from public.products where id = p_product_id)
  on conflict (product_id, visitor_id, viewed_on) do nothing;
$$;

revoke all on function public.record_product_view(uuid, text) from public, anon, authenticated;
grant execute on function public.record_product_view(uuid, text) to service_role;

create or replace view public.product_view_counts
with (security_invoker = false)
as
  select p.id as product_id, count(v.product_id)::bigint as view_count
  from public.products p
  left join public.product_views v on v.product_id = p.id
  group by p.id;

revoke all on public.product_view_counts from public, anon, authenticated;
grant select on public.product_view_counts to service_role;
