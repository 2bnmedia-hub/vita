# VITA / V-FORM NUTRITION — Project State

## Stack
Next.js 14 + TypeScript + Tailwind + Supabase + Vercel
Path: /Volumes/Haytham Salim/פרויקטים פיתוח אתרים/  V FORM/vita-main

## Production
- Domain: https://www.vform-nutrition.com
- Vercel project: vita (team 2bnmedia-7254)
- Deploy: npx vercel --prod --force --yes (CLI — bypasses git block)

## Supabase
- Project URL: https://uixfwazfrtcakzeghgml.supabase.co
- Admin user: 2bnbussiness@gmail.com / pass: 123456
- IMPORTANT: env vars in Vercel must point to uixfwazf (NOT old exsgjnixzreh)

## Fixed
- Admin auth (login + session)
- Vercel env vars
- DNS (A @ 76.76.21.21, CNAME www cname.vercel-dns.com)
- Navbar build error (selectItemCount)
- Cart = 0 bug (Number(price) in supabase.ts: getProducts/getProductBySlug/getFeaturedProducts)

## Open
- Cart placeholder images
- Contact form -> connect to Supabase contact_submissions table
- Full checkout
- Coupons/discounts
