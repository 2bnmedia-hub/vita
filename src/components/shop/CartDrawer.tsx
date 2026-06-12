"use client";

import { useEffect } from "react";
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } =
    useCartStore();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-full max-w-[400px] bg-navy-800 border-r border-white/[0.08] shadow-[8px_0_48px_rgba(0,0,0,0.6)] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="סל קניות"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-cyan" />
            <h2 className="font-bold text-lg">הסל שלי</h2>
            {itemCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-cyan text-navy-900 text-xs font-black">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:border-white/20 transition-all"
            aria-label="סגור"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-5 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-20 h-20 rounded-2xl glass-cyan flex items-center justify-center">
                <ShoppingCart className="w-9 h-9 text-cyan/50" />
              </div>
              <div>
                <p className="font-bold text-white/60">הסל ריק</p>
                <p className="text-sm text-white/30 mt-1">הוסף מוצרים מהחנות</p>
              </div>
              <Link
                href="/shop"
                onClick={closeCart}
                className="btn-primary bg-cyan text-navy-900 font-bold px-6 py-2.5 rounded-xl text-sm mt-2"
              >
                לחנות
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 p-3 rounded-xl glass border border-white/[0.06]"
              >
                {/* Product thumb */}
                <div className="w-16 h-16 rounded-lg bg-navy-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <span className="text-3xl">🏋️</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight line-clamp-2">
                    {item.product.name}
                  </p>
                  <p className="text-cyan font-bold text-sm mt-1">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>

                  {/* Quantity */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg glass flex items-center justify-center hover:border-white/20 transition-all"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg glass flex items-center justify-center hover:border-white/20 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="self-start w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  aria-label="הסר מוצר"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-5 border-t border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">סה"כ</span>
              <span className="font-black text-xl text-white">{formatPrice(total)}</span>
            </div>
            <button className="btn-primary w-full bg-cyan text-navy-900 font-black py-3.5 rounded-xl text-base hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2">
              לתשלום
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={closeCart}
              className="w-full glass py-2.5 rounded-xl text-sm text-white/60 hover:text-white transition-colors"
            >
              המשך קנייה
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
