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

## גרסה נוכחית מאושרת ✅
- תאריך: 07/07/2026
- דומיין: https://www.vform-nutrition.com
- הקוד המקומי בתיקייה זו (vita-main) הוא הגרסה הנכונה והעדכנית — פרוס ממנה כרגיל.
- נוסף: אפשרות משלוח "איסוף עצמי" (חינם) + שליחת מייל אוטומטי לכל הזמנה ל-vformnutrition@gmail.com דרך Resend (RESEND_API_KEY מוגדר גם ב-.env.local וגם ב-Vercel production env vars)
- תוקן: טבלת orders ב-Supabase (uixfwazfrtcakzeghgml) הייתה חסרה עמודות address/shipping_region/shipping_cost - נוספו, הצ'קאאוט עובד קצה-לקצה

## קופונים (04/10/2026)
- טבלת `coupons` + פונקציית `reserve_coupon()` — ראה `supabase-coupons-migration.sql`. הקוד: `src/lib/coupons.ts`, `/api/checkout/coupon` (בדיקה בלבד), שריון בתוך `/api/checkout/create-order`.
- אחוז הנחה על סכום המוצרים בלבד (לא על משלוח), קוד אחד להזמנה, לא תלוי רישיות.
- מימוש נספר רק בתוך `confirm_tranzila_payment()` (תשלום מאומת). זיכוי לא מחזיר את הקופון.
- `nimry15` — 15%, מימוש אחד בכל האתר. הוספת קופון חדש: `insert into coupons (code, percent_off, max_redemptions)` (קוד באותיות קטנות).

## Tranzila — מצב (04/10/2026)
- מסוף `fxpvythtvspy`, מסוף אמיתי (עסקאות מאושרות דרך SHVA).
- אימות עסקה בשרת: `POST https://report.tranzila.com/v1/transaction` (יחיד, שרת הדוחות). הנתיב `/v1/transactions` מחזיר 0 שורות למסוף הזה — זו הייתה הסיבה שאף הזמנה לא סומנה "שולם" עד 04/10/2026. הסכום בתשובה באגורות.
- חשבוניות: לפי טרנזילה אין הפקה אוטומטית במסוף; מסמכים מופקים ידנית.

## Open
- Cart placeholder images
- Contact form -> connect to Supabase contact_submissions table
