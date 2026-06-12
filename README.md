# VFORM NUTRITION — אתר חנות

> Next.js 14 · Supabase · Tailwind CSS · TypeScript · Vercel

## Stack

| שכבה | טכנולוגיה |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + globals.css |
| Animations | Framer Motion + CSS |
| State | Zustand (cart store, persisted) |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| CI/CD | GitHub Actions |

## מבנה הפרויקט

```
src/
├── app/
│   ├── layout.tsx          # Root layout (Navbar, Footer, CartDrawer)
│   ├── page.tsx            # דף בית
│   ├── shop/
│   │   ├── page.tsx        # חנות (SSR + filters)
│   │   └── [slug]/
│   │       └── page.tsx    # דף מוצר
│   └── contact/
│       └── page.tsx        # צור קשר
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── sections/
│   │   ├── HeroSection.tsx
│   │   ├── FeaturedProducts.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── AboutSection.tsx
│   │   └── ContactForm.tsx
│   └── shop/
│       ├── ProductCard.tsx
│       ├── ProductDetailClient.tsx
│       ├── ShopFilters.tsx
│       └── CartDrawer.tsx
├── lib/
│   ├── supabase.ts         # Supabase client + queries + mock data
│   └── utils.ts
├── store/
│   └── cart.ts             # Zustand cart store
└── types/
    └── index.ts
```

## התקנה מקומית

```bash
git clone https://github.com/YOUR_USERNAME/vform-nutrition.git
cd vform-nutrition
npm install
cp .env.local.example .env.local
# ערוך .env.local עם פרטי Supabase
npm run dev
```

## Supabase — הגדרה

1. צור פרויקט חדש ב-[supabase.com](https://supabase.com)
2. בSQL Editor הרץ את `supabase-schema.sql`
3. העתק את `Project URL` ו-`anon public key`
4. הדבק ב-`.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Deploy ל-Vercel

1. Push ל-GitHub
2. ב-Vercel: Import Repository
3. הוסף Environment Variables (אותם כמו `.env.local`)
4. Deploy אוטומטי בכל push ל-`main`

## שלבים הבאים

- [ ] החלף emoji placeholders בתמונות אמיתיות (Next/Image + Supabase Storage)
- [ ] חבר טופס יצירת קשר לטבלת `contact_submissions` ב-Supabase
- [ ] הוסף שער תשלום (Tranzilla / PayPlus / Stripe)
- [ ] הוסף admin dashboard לניהול מוצרים
- [ ] הוסף Google Analytics / Plausible
- [ ] הגדר Domain ב-Vercel
 
.
