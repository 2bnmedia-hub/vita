import { supabase } from "@/lib/auth";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts, getCategories } from "@/lib/supabase";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { ProductCardSkeleton } from "@/components/shop/ProductCardSkeleton";

export const metadata: Metadata = {
  title: "חנות | VITA Nutrition",
  description: "כל מוצרי VITA NUTRITION — קריאטין אבקה וטבליות לעיסה.",
};

// Force dynamic so searchParams always fresh
export const dynamic = "force-dynamic";

interface ShopPageProps {
  searchParams: {
    cat?: string;
    sort?: string;
    q?: string;
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const [products, categories] = await Promise.all([
    getProducts({
      category: searchParams.cat || undefined,
      search: searchParams.q || undefined,
      sort: searchParams.sort as any,
    }),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen bg-navy-950 pt-24" dir="rtl">
      {/* Hero bar */}
      <div className="relative bg-navy-900 border-b border-white/[0.06] py-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="orb w-64 h-64 bg-cyan/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block text-cyan text-xs font-bold uppercase tracking-widest mb-2">
            חנות
          </span>
          <h1 className="text-4xl font-black tracking-tight">כל המוצרים</h1>
          <p className="mt-2 text-white/50">
            {products.length} מוצרים · קריאטין מונוהידראט איכותי
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Filters */}
        <ShopFilters
          categories={categories}
          currentCat={searchParams.cat}
          currentSort={searchParams.sort}
          currentSearch={searchParams.q}
        />

        {/* Grid */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">
              {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          }
        >
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 space-y-3">
              <p className="text-5xl">🔍</p>
              <p className="text-white/40 text-lg">לא נמצאו מוצרים</p>
              {(searchParams.q || searchParams.cat) && (
                <a
                  href="/shop"
                  className="inline-block mt-2 text-cyan text-sm hover:underline"
                >
                  נקה פילטרים
                </a>
              )}
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
