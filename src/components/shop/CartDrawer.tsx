"use client";

import { useEffect, useRef } from "react";
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowLeft } from "lucide-react";
import { useCartStore, selectTotal, selectItemCount } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

const PLACEHOLDER = "/creatine-hero.png";

export function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const total = useCartStore(selectTotal);
  const itemCount = useCartStore(selectItemCount);
  const drawerRef = useRef<HTMLElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Focus trap + Escape-to-close + return focus to trigger
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const drawer = drawerRef.current;
    const focusables = drawer?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCart();
        return;
      }
      if (e.key === "Tab" && focusables && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused?.focus();
    };
  }, [isOpen, closeCart]);

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
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full z-50 w-full max-w-[400px] bg-navy-800 border-r border-white/[0.08] shadow-[8px_0_48px_rgba(0,0,0,0.6)] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
        style={{ visibility: isOpen ? "visible" : "hidden" }}
        role="dialog"
        aria-modal="true"
        aria-label="סל קניות"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-cyan" aria-hidden="true" />
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
            aria-label="סגור סל קניות"
          >
            <X className="w-4 h-4" aria-hidden="true" />
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
            items.map((item) => {
              const imgSrc =
                Array.isArray(item.product.images) &&
                item.product.images.length > 0 &&
                item.product.images[0]
                  ? item.product.images[0]
                  : PLACEHOLDER;

              return (
                <div
                  key={item.product.id}
                  className="flex gap-3 p-3 rounded-xl glass border border-white/[0.06]"
                >
                  {/* Product thumb */}
                  <div className="w-16 h-16 rounded-lg bg-navy-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={item.product.name}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER;
                      }}
                    />
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
                        aria-label={`הקטן כמות של ${item.product.name}`}
                        className="w-7 h-7 rounded-lg glass flex items-center justify-center hover:border-white/20 transition-all"
                      >
                        <Minus className="w-3 h-3" aria-hidden="true" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        aria-label={`הגדל כמות של ${item.product.name}`}
                        className="w-7 h-7 rounded-lg glass flex items-center justify-center hover:border-white/20 transition-all"
                      >
                        <Plus className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="self-start w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    aria-label={`הסר את ${item.product.name} מהסל`}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-5 border-t border-white/[0.08] space-y-4">

            {/* Subtotal */}
            <div className="space-y-1.5">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-xs text-white/40">
                  <span>{item.product.name} × {item.quantity}</span>
                  <span>{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-lg border-t border-white/[0.06] pt-3">
                <span>סה&quot;כ</span>
                <span className="text-white">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-white/30 text-left">+ משלוח לפי אזור — יחושב בתשלום</p>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full bg-cyan text-navy-900 font-black py-3.5 rounded-xl text-base hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2"
            >
              לתשלום
              <ArrowLeft className="w-4 h-4" />
            </Link>
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
