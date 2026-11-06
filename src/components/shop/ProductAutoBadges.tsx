"use client";

import { Sparkles, Package, BadgePercent, Tag, Clock, Rocket, Gift, Coins, Check, type LucideIcon } from "lucide-react";

type Props = {
  product: {
    tags?: string[] | null;
  };
  admin?: boolean;
  onChangeTags?: (tags: string[]) => void;
};

/** Shared look for every product tag: same size, weight, padding, radius. No glow. */
export const TAG_BASE = "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold leading-none whitespace-nowrap shadow-none";
export const SALE_TAG = "bg-red-500/85 text-white";
export const BESTSELLER_TAG = "bg-[#7C3AED] text-white";

const options: { tag: string; label: string; color: string; icon: LucideIcon; hex: string }[] = [
  {
    tag: "manual:new",
    hex: "#14B8A6",
    icon: Sparkles,
    label: "חדש באתר",
    color: "bg-[#0F766E] text-white",
  },
  {
    tag: "manual:limited-stock",
    hex: "#F59E0B",
    icon: Package,
    label: "מלאי מוגבל",
    color: "bg-[#B45309] text-white",
  },
  {
    tag: "manual:hot-price",
    hex: "#EF4444",
    icon: BadgePercent,
    label: "🔥 מחיר מבצע",
    color: SALE_TAG,
  },
  {
    tag: "manual:special-price",
    hex: "#EC4899",
    icon: Tag,
    label: "מחיר מיוחד",
    color: "bg-[#DB2777] text-white",
  },
  {
    tag: "manual:limited-time",
    hex: "#F97316",
    icon: Clock,
    label: "הטבה לזמן מוגבל",
    color: "bg-[#EA580C] text-white",
  },
  {
    tag: "manual:launch-price",
    hex: "#3B82F6",
    icon: Rocket,
    label: "מחיר השקה",
    color: "bg-[#2563EB] text-white",
  },
  {
    tag: "manual:special-deal",
    hex: "#D946EF",
    icon: Gift,
    label: "מבצע מיוחד",
    color: "bg-[#C026D3] text-white",
  },
  {
    tag: "manual:great-price",
    hex: "#22C55E",
    icon: Coins,
    label: "מחיר משתלם במיוחד",
    color: "bg-[#15803D] text-white",
  },
];

/** Admin toggle chip: icon tinted in the tag's own color, checked state fills with that color. */
export function TagChip({ label, icon: Icon, hex, checked, onChange }: {
  label: string; icon: LucideIcon; hex: string; checked: boolean; onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center gap-2.5 h-12 px-3 rounded-xl border cursor-pointer select-none transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyan ${checked ? "" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}
      style={checked ? { borderColor: hex, backgroundColor: `${hex}1F` } : undefined}>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${hex}26`, color: hex }}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </span>
      <span className={`flex-1 text-sm font-medium ${checked ? "text-white" : "text-white/75"}`}>{label}</span>
      <span className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${checked ? "" : "border-white/25"}`}
        style={checked ? { backgroundColor: hex, borderColor: hex } : undefined} aria-hidden="true">
        {checked && <Check className="w-3.5 h-3.5 text-white" />}
      </span>
    </label>
  );
}

export const TAG_GRID = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5";

export function ProductAutoBadges({
  product, admin = false, onChangeTags,
}: Props) {
  const tags = Array.isArray(product.tags) ? product.tags : [];

  if (admin) {
    return (
      <div className={TAG_GRID}>
        {options.map(({ tag, label, icon, hex }) => (
          <TagChip key={tag} label={label} icon={icon} hex={hex}
            checked={tags.includes(tag)}
            onChange={(checked) => {
              const remaining = tags.filter(value => value !== tag);
              onChangeTags?.(checked ? [...remaining, tag] : remaining);
            }} />
        ))}
      </div>
    );
  }

  return (
    <>
      {options.filter(option => tags.includes(option.tag)).map(
        ({ tag, label, color, icon: Icon }) => (
          <span key={tag}
            className={`${TAG_BASE} ${color}`}>
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {label}
          </span>
        )
      )}
    </>
  );
}
