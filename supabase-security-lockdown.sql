-- V FORM security lockdown (4/11/2026).
-- RUN ONLY AFTER the deploy that moved admin writes to /api/admin/* is live —
-- before that, the admin panel still writes with the anon key and would break.
--
-- Found live: the public anon key (shipped in every browser) could UPDATE/INSERT/DELETE
-- products (prices!) and categories, and SELECT every contact_submissions row.
-- After this: anon/authenticated may only READ products & categories and INSERT
-- contact messages. All writes go through the service role on the server.
-- Deletes no data. Safe to re-run.

begin;

alter table public.products            enable row level security;
alter table public.categories          enable row level security;
alter table public.contact_submissions enable row level security;

-- Drop every policy that grants anything beyond the intended minimum.
do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and (
        (tablename in ('products', 'categories') and cmd <> 'SELECT')
        or (tablename = 'contact_submissions' and cmd <> 'INSERT')
      )
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
    raise notice 'dropped policy % on %', p.policyname, p.tablename;
  end loop;

  -- Storage: nobody but the service role may write product images.
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and cmd <> 'SELECT'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%product-images%'
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
    raise notice 'dropped storage policy %', p.policyname;
  end loop;
end $$;

-- Re-assert the intended public access (idempotent).
drop policy if exists "vform_public_read_products" on public.products;
create policy "vform_public_read_products" on public.products for select to anon, authenticated using (true);

drop policy if exists "vform_public_read_categories" on public.categories;
create policy "vform_public_read_categories" on public.categories for select to anon, authenticated using (true);

drop policy if exists "vform_public_contact_insert" on public.contact_submissions;
create policy "vform_public_contact_insert" on public.contact_submissions for insert to anon, authenticated with check (true);

commit;

-- Verify (expect: products/categories only SELECT, contact_submissions only INSERT,
-- no non-SELECT storage policy mentioning product-images):
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where (schemaname = 'public' and tablename in ('products', 'categories', 'contact_submissions'))
   or (schemaname = 'storage' and tablename = 'objects')
order by 1, 2, 4;
