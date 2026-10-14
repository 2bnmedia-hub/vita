"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { useCartStore, useCartTotals, SHIPPING_LABEL } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

/**
 * Price breakdown + coupon field, shared by the cart drawer and checkout so
 * both always show the same numbers. Display only — create-order re-prices
 * everything (coupon included) from the DB before any charge.
 */
export function CouponSummary({ disabled = false }: { disabled?: boolean }) {
  const { subtotal, discount, shipping, region, coupon, total } = useCartTotals();
  const setCoupon = useCartStore((s) => s.setCoupon);
  const inputId = useId();
  const [input, setInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    const code = input.trim();
    if (!code || checking) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.ok && data.rule) setCoupon({ code: code.toLowerCase(), rule: data.rule, terms: data.terms ?? null });
      else setError(data.message || "לא ניתן לבדוק את הקופון כרגע.");
    } catch {
      setError("שגיאת רשת. נסה/י שוב.");
    }
    setChecking(false);
  };

  const remove = () => {
    setCoupon(null);
    setInput("");
    setError(null);
  };

  const status = error
    ? { ok: false, text: error }
    : coupon
      ? discount > 0
        ? { ok: true, text: "הקופון הוחל בהצלחה." }
        : { ok: false, text: coupon.terms || "הסל אינו עומד בתנאי הקופון." }
      : null;

  const field =
    "w-full bg-navy-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:border-cyan/40 focus:outline-none focus:ring-2 focus:ring-cyan/10 transition-all";

  return (
    <>
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-white/50">
          <span>סכום המוצרים</span>
          <span className="text-white/70" data-testid="subtotal">{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && coupon && (
          <div className="flex justify-between text-sm text-cyan" data-testid="coupon-discount">
            <span>הנחת קופון {coupon.code.toUpperCase()}</span>
            <span dir="ltr">−{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-white/50">
          <span>משלוח ({SHIPPING_LABEL[region]})</span>
          <span className="text-white/70">{formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between font-black text-lg pt-1">
          <span>סה&quot;כ לתשלום</span>
          <span className="text-white" data-testid="grand-total">{formatPrice(total)}</span>
        </div>
      </div>

      <div className="border-t border-white/[0.06] mt-4 pt-4 space-y-2">
        <label htmlFor={inputId} className="text-white/50 text-xs font-bold uppercase tracking-wider">קוד קופון</label>
        <div className="flex gap-2">
          <input
            id={inputId}
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            value={coupon ? coupon.code.toUpperCase() : input}
            disabled={!!coupon || disabled}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }}
            className={`${field} disabled:opacity-60`}
          />
          {coupon ? (
            <button
              type="button"
              disabled={disabled}
              onClick={remove}
              className="shrink-0 px-4 rounded-xl border border-white/[0.08] text-white/60 text-sm font-bold hover:border-white/20 transition-colors disabled:opacity-50"
            >
              הסר
            </button>
          ) : (
            <button
              type="button"
              onClick={apply}
              disabled={checking || !input.trim() || disabled}
              className="shrink-0 px-4 rounded-xl bg-cyan/10 border border-cyan/40 text-cyan text-sm font-bold hover:bg-cyan/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : "החל"}
            </button>
          )}
        </div>
        {status && (
          <p role="status" data-testid="coupon-message" className={`text-xs ${status.ok ? "text-cyan" : "text-red-400"}`}>{status.text}</p>
        )}
      </div>
    </>
  );
}
