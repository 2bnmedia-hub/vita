"use client";

import { useEffect, useState } from "react";

type Props = {
  product: {
    created_at?: string | null;
    in_stock?: boolean;
    stock_quantity?: number | null;
  };
  admin?: boolean;
  isNewProduct?: boolean;
};

export function ProductAutoBadges({
  product, admin = false, isNewProduct = false,
}: Props) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const created = product.created_at
    ? Date.parse(product.created_at)
    : NaN;
  const age = now === null ? NaN : now - created;
  const isNew = isNewProduct ||
    (Number.isFinite(age) && age >= 0 && age < 30 * 24 * 60 * 60 * 1000);
  const quantity = product.stock_quantity;
  const limited = product.in_stock === true &&
    typeof quantity === "number" &&
    Number.isInteger(quantity) && quantity >= 1 && quantity <= 5;

  const badges = [
    { label: "חדש באתר", active: isNew, color: "bg-cyan text-navy-900" },
    { label: "מלאי מוגבל", active: limited, color: "bg-amber-400 text-navy-900" },
  ];

  if (admin) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-6">
          {badges.map(({ label, active }) => (
            <label key={label} className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={active} disabled readOnly
                className="w-4 h-4 accent-cyan" />
              {label} — אוטומטי
            </label>
          ))}
        </div>
        <p className="text-xs text-white/40">
          חדש באתר: 30 יום ממועד יצירת המוצר.
          מלאי מוגבל: רק כשיש במלאי 1–5 יחידות.
          כמות ריקה אינה נחשבת למלאי מוגבל.
        </p>
      </div>
    );
  }

  return (
    <>
      {badges.filter(b => b.active).map(({ label, color }) => (
        <span key={label}
          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${color}`}>
          {label}
        </span>
      ))}
    </>
  );
}
