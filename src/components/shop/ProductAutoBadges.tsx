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
];

export function ProductAutoBadges({
  product, admin = false, onChangeTags,
}: Props) {
  const tags = Array.isArray(product.tags) ? product.tags : [];

  if (admin) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-6">
          {options.map(({ tag, label }) => (
            <label key={tag}
              className="flex items-center gap-2 text-base text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={tags.includes(tag)}
                onChange={(event) => {
                  const remaining = tags.filter(value => value !== tag);
                  onChangeTags?.(
                    event.target.checked ? [...remaining, tag] : remaining
                  );
                }}
                className="w-4 h-4 accent-teal-700"
              />
              {label}
            </label>
          ))}
        </div>
        <p className="text-sm text-slate-600">
          סימון ידני בלבד. ניתן לבחור את שתי התגיות יחד.
          יש ללחוץ על שמירה כדי לעדכן את האתר.
        </p>
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
