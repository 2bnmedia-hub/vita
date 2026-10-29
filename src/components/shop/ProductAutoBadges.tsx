"use client";

type Props = {
  product: {
    tags?: string[] | null;
  };
  admin?: boolean;
  onChangeTags?: (tags: string[]) => void;
};

const options = [
  {
    tag: "manual:new",
    label: "חדש באתר",
    color: "bg-cyan text-navy-900",
  },
  {
    tag: "manual:limited-stock",
    label: "מלאי מוגבל",
    color: "bg-amber-400 text-navy-900",
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
        <p className="text-xs text-white/40">
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
            className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${color}`}>
            {label}
          </span>
        )
      )}
    </>
  );
}
