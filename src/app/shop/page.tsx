import type { Metadata } from "next";
import { getProducts } from "@/lib/supabase";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";

export const metadata: Metadata = {
  title: "חנות",
  description: "כל מוצרי VFORM NUTRITION — קריאטין אבקה וטבליות לעיסה.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { cat?: string; sort?: string };
}) {
  const products = await getProducts();

  // Filter
  const filtered =
    searchParams.cat === "powder"
      ? products.filter((p) => p.category === "קריאטין" && !p.name.includes("טבליות"))
      : searchParams.cat === "chewable"
      ? products.filter((p) => p.name.includes("טבליות"))
      : products;

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (searchParams.sort === "price-asc") return a.price - b.price;
    if (searchParams.sort === "price-desc") return b.price - a.price;
    return 0;
  });

  return (
    <div className="min-h-screen bg-navy-950 pt-24">
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
            {sorted.length} מוצרים · קריאטין מונוהידראט איכותי
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Filters */}
        <ShopFilters currentCat={searchParams.cat} currentSort={searchParams.sort} />

        {/* Grid */}
        {sorted.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">
            {sorted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-white/30 text-lg">לא נמצאו מוצרים</p>
          </div>
        )}
      </div>
    </div>
  );
}
