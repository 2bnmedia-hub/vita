"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, ChevronRight, Star, Shield, Truck, RotateCcw } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice, calcDiscount } from "@/lib/utils";
import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import toast from "react-hot-toast";

const guarantees = [
  { icon: Shield, text: "ייצור מוסמך GMP" },
  { icon: Truck, text: "משלוח מהיר" },
  { icon: RotateCcw, text: "מדיניות החזרה" },
];

export function ProductDetailClient({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCartStore();
  const discount = product.compare_price
    ? calcDiscount(product.price, product.compare_price)
    : null;

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product);
    toast.success(`${qty}× ${product.name} נוסף לסל!`, { icon: "🛒" });
  };

  return (
    <div className="min-h-screen bg-navy-950 pt-24">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-white/30">
          <Link href="/" className="hover:text-white transition-colors">בית</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/shop" className="hover:text-white transition-colors">חנות</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60 truncate">{product.name}</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          {/* Image */}
          <div className="sticky top-28">
            <div className="relative aspect-square rounded-3xl bg-navy-800 border border-white/[0.07] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-transparent" />
              <span className="text-[160px]">
                {product.flavor?.includes("ענבים") ? "🍇" :
                 product.flavor?.includes("פירות") ? "🍹" :
                 product.name.includes("טבליות") ? "💊" : "🏋️"}
              </span>
              {product.badge && (
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-cyan text-navy-900 font-black text-sm shadow-cyan">
                  {product.badge}
                </div>
              )}
              {discount && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-red-500 text-white font-black text-sm">
                  -{discount}%
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="py-4">
            {/* Category & flavor */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-cyan text-xs font-black uppercase tracking-widest">{product.category}</span>
              {product.flavor && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-white/40 text-xs">{product.flavor}</span>
                </>
              )}
            </div>

            <h1 className="text-3xl font-black tracking-tight mb-4">{product.name}</h1>

            {/* Stars */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-cyan/70 text-cyan/70" />
                ))}
              </div>
              <span className="text-white/30 text-sm">4.9 (12 ביקורות)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-black text-white">{formatPrice(product.price)}</span>
              {product.compare_price && (
                <span className="text-white/30 text-xl line-through">
                  {formatPrice(product.compare_price)}
                </span>
              )}
              {discount && (
                <span className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 text-sm font-bold">
                  חסכת {formatPrice(product.compare_price! - product.price)}
                </span>
              )}
            </div>

            {/* Specs chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {product.weight && <Chip>{product.weight}</Chip>}
              {product.servings && <Chip>{product.servings} מנות</Chip>}
              {product.serving_size && <Chip>{product.serving_size} / מנה</Chip>}
              {product.in_stock ? (
                <Chip className="border-green-500/30 text-green-400">✓ במלאי</Chip>
              ) : (
                <Chip className="border-red-500/30 text-red-400">אזל המלאי</Chip>
              )}
            </div>

            {/* Description */}
            <p className="text-white/55 leading-relaxed mb-7">{product.long_description}</p>

            {/* Quantity + Add */}
            <div className="flex gap-4 items-center mb-6">
              <div className="flex items-center glass border border-white/[0.08] rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-11 h-11 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all text-lg"
                >
                  −
                </button>
                <span className="w-10 text-center font-bold">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-11 h-11 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all text-lg"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAdd}
                disabled={!product.in_stock}
                className="btn-primary flex-1 flex items-center justify-center gap-2 bg-cyan text-navy-900 font-black py-3.5 rounded-xl text-base hover:bg-cyan-600 transition-colors shadow-cyan disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                הוסף לסל
              </button>
            </div>

            {/* Guarantees */}
            <div className="flex flex-wrap gap-4 pt-5 border-t border-white/[0.06]">
              {guarantees.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/40 text-sm">
                  <Icon className="w-4 h-4 text-cyan flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>

            {/* Nutrition facts */}
            {product.nutrition_facts && (
              <div className="mt-7 glass border border-white/[0.07] rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">
                  ערכים תזונתיים / מנה
                </h3>
                <div className="divide-y divide-white/[0.06]">
                  {Object.entries(product.nutrition_facts).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2.5">
                      <span className="text-white/50 text-sm">{k}</span>
                      <span className="font-bold text-white text-sm">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-black mb-7">מוצרים נוספים</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.slice(0, 3).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`px-3 py-1 rounded-lg bg-navy-700/60 border border-white/[0.08] text-white/50 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}
