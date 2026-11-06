"use client";

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

const options = [
  {
    tag: "manual:new",
    label: "חדש באתר",
    color: "bg-[#0F766E] text-white",
  },
  {
    tag: "manual:limited-stock",
    label: "מלאי מוגבל",
    color: "bg-[#B45309] text-white",
  },
  {
    tag: "manual:hot-price",
    label: "🔥 מחיר מבצע",
    color: SALE_TAG,
  },
  {
    tag: "manual:special-price",
    label: "מחיר מיוחד",
    color: SALE_TAG,
  },
  {
    tag: "manual:limited-time",
    label: "הטבה לזמן מוגבל",
    color: SALE_TAG,
  },
  {
    tag: "manual:launch-price",
    label: "מחיר השקה",
    color: SALE_TAG,
  },
  {
    tag: "manual:special-deal",
    label: "מבצע מיוחד",
    color: SALE_TAG,
  },
  {
    tag: "manual:great-price",
    label: "מחיר משתלם במיוחד",
    color: SALE_TAG,
  },
];

export function ProductAutoBadges({
  product, admin = false, onChangeTags,
}: Props) {
  const tags = Array.isArray(product.tags) ? product.tags : [];

  if (admin) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {options.map(({ tag, label }) => (
            <label key={tag}
              className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={tags.includes(tag)}
                onChange={(event) => {
                  const remaining = tags.filter(value => value !== tag);
                  onChangeTags?.(
                    event.target.checked ? [...remaining, tag] : remaining
                  );
                }}
                className="w-4 h-4 accent-cyan"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {options.filter(option => tags.includes(option.tag)).map(
        ({ tag, label, color }) => (
          <span key={tag}
            className={`${TAG_BASE} ${color}`}>
            {label}
          </span>
        )
      )}
    </>
  );
}
