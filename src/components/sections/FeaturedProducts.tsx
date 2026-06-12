import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getFeaturedProducts } from "@/lib/supabase";
import { ProductCard } from "@/components/shop/ProductCard";

export async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  return (
    <section className="relative py-24 bg-navy-950 overflow-hidden">
      {/* Subtle top border glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="inline-block text-cyan text-xs font-bold uppercase tracking-widest mb-3">
              המוצרים שלנו
            </span>
            <h2 className="text-4xl font-black tracking-tight">
              קריאטין. בכל
              <span className="text-gradient"> פורמט שתרצה.</span>
            </h2>
            <p className="mt-3 text-white/50 text-base max-w-md">
              קריאטין מונוהידראט טהור — 3 גרם למנה, 100% איכות.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-cyan font-bold text-sm hover:text-cyan-600 transition-colors whitespace-nowrap"
          >
            כל המוצרים
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
