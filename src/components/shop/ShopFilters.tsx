"use client";

import { useRouter, usePathname } from "next/navigation";

const cats = [
  { label: "הכל", value: "" },
  { label: "אבקה", value: "powder" },
  { label: "טבליות לעיסה", value: "chewable" },
];

const sorts = [
  { label: "ברירת מחדל", value: "" },
  { label: "מחיר עולה", value: "price-asc" },
  { label: "מחיר יורד", value: "price-desc" },
];

export function ShopFilters({
  currentCat,
  currentSort,
}: {
  currentCat?: string;
  currentSort?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (cat?: string, sort?: string) => {
    const params = new URLSearchParams();
    if (cat) params.set("cat", cat);
    if (sort) params.set("sort", sort);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {cats.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => navigate(value || undefined, currentSort)}
            className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              (currentCat ?? "") === value
                ? "bg-cyan text-navy-900 shadow-cyan-sm"
                : "glass border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={currentSort ?? ""}
        onChange={(e) => navigate(currentCat, e.target.value || undefined)}
        className="glass border border-white/[0.08] text-white/70 text-sm rounded-xl px-4 py-1.5 bg-navy-800 cursor-pointer"
      >
        {sorts.map(({ label, value }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
