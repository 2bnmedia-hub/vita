-- VFORM NUTRITION — Supabase Schema
-- Run this in the Supabase SQL editor

-- Products table
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  description text,
  long_description text,
  price       numeric(10,2) not null,
  compare_price numeric(10,2),
  images      text[] default '{}',
  category    text not null default 'קריאטין',
  flavor      text,
  weight      text,
  servings    integer,
  serving_size text,
  in_stock    boolean not null default true,
  featured    boolean not null default false,
  badge       text,
  tags        text[] default '{}',
  nutrition_facts jsonb default '{}',
  created_at  timestamptz not null default now()
);

-- Orders table
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  items       jsonb not null default '[]',
  total       numeric(10,2) not null,
  status      text not null default 'pending',
  notes       text,
  created_at  timestamptz not null default now()
);

-- Contact submissions
create table if not exists public.contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.contact_submissions enable row level security;

-- Public read for products
create policy "Products are publicly readable"
  on public.products for select using (true);

-- Public insert for orders
create policy "Anyone can place an order"
  on public.orders for insert with check (true);

-- Public insert for contact
create policy "Anyone can submit contact form"
  on public.contact_submissions for insert with check (true);

-- Seed initial products
insert into public.products
  (name, slug, description, long_description, price, compare_price, category, flavor, weight, servings, serving_size, in_stock, featured, badge, tags, nutrition_facts)
values
(
  'קריאטין מונוהידראט — ללא טעם',
  'creatine-unflavored',
  'קריאטין נקי ופשוט, מתאים לשילוב בכל משקה ללא שינוי הטעם.',
  'קריאטין מונוהידראט טהור מבית VFORM NUTRITION — הבחירה הקלאסית. מתערבב בקלות עם מים, מיץ, שייק חלבון — בלי לשנות את הטעם.',
  89, 109, 'קריאטין', 'ללא טעם', '500g', 166, '3g', true, true, 'הנמכר ביותר',
  ARRAY['קריאטין','אבקה','ללא טעם'],
  '{"קריאטין מונוהידראט":"3g","קלוריות":"0","פחמימות":"0g"}'::jsonb
),
(
  'קריאטין מונוהידראט — טעם ענבים',
  'creatine-grape',
  'קריאטין בטעם ענבים מרענן, לשימוש יומיומי נוח ומהנה.',
  'קריאטין מונוהידראט בטעם ענבים מרענן ומתוק. 3 גרם למנה, 166 מנות לאריזה.',
  94, 114, 'קריאטין', 'ענבים', '500g', 166, '3g', true, true, 'פופולרי',
  ARRAY['קריאטין','אבקה','ענבים'],
  '{"קריאטין מונוהידראט":"3g","קלוריות":"5","פחמימות":"1g"}'::jsonb
),
(
  'קריאטין מונוהידראט — קוקטייל פירות',
  'creatine-fruit-cocktail',
  'טעם פירותי קליל ומרענן, לחוויית שתייה טעימה.',
  'קריאטין מונוהידראט בטעם קוקטייל פירות עם טעם פירותי קליל.',
  94, 114, 'קריאטין', 'קוקטייל פירות', '500g', 166, '3g', true, false, null,
  ARRAY['קריאטין','אבקה','פירות'],
  '{"קריאטין מונוהידראט":"3g","קלוריות":"5","פחמימות":"1g"}'::jsonb
),
(
  'קריאטין טבליות לעיסה',
  'creatine-chewable',
  'ללא מים, ללא ערבוב — 150 טבליות בטעם קוקטייל פירות.',
  'טבליות קריאטין ללעיסה — הדרך הנוחה לקחת קריאטין בכל יום. ללא מים, ללא ערבוב, פחות מ-2 קק"ל לטבלייה.',
  99, 129, 'קריאטין', 'קוקטייל פירות', '150 טבליות', 50, '3 טבליות', true, true, 'חדש',
  ARRAY['קריאטין','טבליות','ללא מים'],
  '{"קריאטין מונוהידראט":"3g","קלוריות":"<2 לטבלייה","שומן":"0g"}'::jsonb
);
