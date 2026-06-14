"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Star } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice, calcDiscount } from "@/lib/utils";
import type { Product } from "@/types";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: Product;
}

const flavorColors: Record<string, string> = {
  "ללא טעם":      "text-white/50",
  ענבים:           "text-purple-400",
  "קוקטייל פירות": "text-pink-400",
};

// Fallback placeholder when no image or image fails to load
const PLACEHOLDER = "/creatine-hero.png";

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const discount = product.compare_price
    ? calcDiscount(product.price, product.compare_price)
    : null;

  // Pick first real image, fall back to placeholder
  const imageSrc =
    Array.isArray(product.images) && product.images.length > 0 && product.images[0]
      ? product.images[0]
      : PLACEHOLDER;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name} נוסף לסל!`, { icon: "🛒" });
  };

  return (
    <div className="product-card group relative bg-navy-800 border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col">
      {/* Badges */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        {product.badge && (
          <span className="px-2.5 py-1 rounded-lg bg-cyan text-navy-900 text-xs font-black shadow-cyan-sm">
            {product.badge}
          </span>
        )}
        {discount && (
          <span className="px-2.5 py-1 rounded-lg bg-red-500/90 text-white text-xs font-bold">
            -{discount}%
          </span>
        )}
      </div>

      {/* Image area */}
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative h-52 bg-gradient-to-br from-navy-900 to-navy-950 flex items-center justify-center overflow-hidden">
          {/* Glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <Image
            src={imageSrc}
            alt={product.name}
            width={180}
            height={180}
            className="object-contain w-36 h-36 drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER;
            }}
          />

          {/* Scan line */}
          <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="animate-scan w-full h-8 bg-gradient-to-b from-transparent via-cyan/6 to-transparent" />
          </div>
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Flavor tag */}
        {product.flavor && (
          <span
            className={`text-xs font-bold uppercase tracking-wider mb-1 ${
              flavorColors[product.flavor] ?? "text-cyan/70"
            }`}
          >
            {product.flavor}
          </span>
        )}

        {/* Name */}
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-bold text-white text-base leading-snug hover:text-cyan transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Specs chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.weight && (
            <span className="px-2 py-0.5 rounded-md bg-navy-700/60 border border-white/[0.08] text-white/50 text-xs font-medium">
              {product.weight}
            </span>
          )}
          {product.servings && (
            <span className="px-2 py-0.5 rounded-md bg-navy-700/60 border border-white/[0.08] text-white/50 text-xs font-medium">
              {product.servings} מנות
            </span>
          )}
          {product.serving_size && (
            <span className="px-2 py-0.5 rounded-md bg-navy-700/60 border border-white/[0.08] text-white/50 text-xs font-medium">
              {product.serving_size}/מנה
            </span>
          )}
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-cyan/60 text-cyan/60" />
          ))}
          <span className="text-white/30 text-xs mr-1">(12)</span>
        </div>

        <div className="flex-1" />

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="font-black text-xl text-white">
              {formatPrice(product.price)}
            </span>
            {product.compare_price && (
              <span className="text-white/30 text-sm line-through mr-2">
                {formatPrice(product.compare_price)}
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            className="btn-primary flex items-center gap-1.5 bg-cyan text-navy-900 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-cyan-600 transition-colors shadow-cyan-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            הוסף
          </button>
        </div>
      </div>
    </div>
  );
}
