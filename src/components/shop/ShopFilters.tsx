"use client";

import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useRef, useTransition } from "react";

const sorts = [
  { label: "ברירת מחדל (חדש)", value: "newest" },
  { label: "מומלצים", value: "featured" },
  { label: "מחיר עולה ↑", value: "price-asc" },
  { label: "מחיר יורד ↓", value: "price-desc" },
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ShopFiltersProps {
  categories: Category[];
  currentCat?: string;
  currentSort?: string;
  currentSearch?: string;
}

export function ShopFilters({
  categories,
  currentCat,
  currentSort,
  currentSearch,
}: ShopFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  const navigate = (overrides: {
    cat?: string | null;
    sort?: string | null;
    q?: string | null;
  }) => {
    const params = new URLSearchParams();
    const cat  = "cat"  in overrides ? overrides.cat  : currentCat;
    const sort = "sort" in overrides ? overrides.sort : currentSort;
    const q    = "q"    in overrides ? overrides.q    : currentSearch;
    if (cat)  params.set("cat", cat);
    if (sort) params.set("sort", sort);
    if (q)    params.set("q", q);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchRef.current?.value.trim() || null;
    navigate({ q });
  };

  const clearSearch = () => {
    if (searchRef.current) searchRef.current.value = "";
    navigate({ q: null });
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <input
          ref={searchRef}
          type="text"
          defaultValue={currentSearch ?? ""}
          placeholder="חיפוש מוצר..."
          className="w-full bg-navy-800 border border-white/[0.08] rounded-xl pr-10 pl-10 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan/40 transition-colors"
        />
        {currentSearch && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Category pills + Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Category pills — dynamic from DB */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate({ cat: null })}
            className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              !currentCat
                ? "bg-cyan text-navy-900 shadow-cyan-sm"
                : "glass border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20"
            }`}
          >
            הכל
          </button>
          {categories.map(({ id, name }) => (
            <button
              key={id}
              onClick={() => navigate({ cat: name })}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                currentCat === name
                  ? "bg-cyan text-navy-900 shadow-cyan-sm"
                  : "glass border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={currentSort ?? "newest"}
          onChange={(e) => navigate({ sort: e.target.value || null })}
          className="glass border border-white/[0.08] text-white/70 text-sm rounded-xl px-4 py-1.5 bg-navy-800 cursor-pointer focus:outline-none focus:border-cyan/40"
        >
          {sorts.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="h-0.5 w-full bg-navy-800 overflow-hidden rounded-full">
          <div className="h-full bg-cyan animate-[loading_1s_ease-in-out_infinite]" style={{ width: "40%" }} />
        </div>
      )}
    </div>
  );
}
