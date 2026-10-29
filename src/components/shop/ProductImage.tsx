"use client";

import { useState } from "react";

type ProductImageProps = {
  src?: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

export function ProductImage({ src, alt, className, loading }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span role="img" aria-label={alt ? `אין תמונה זמינה: ${alt}` : "אין תמונה זמינה"}
        className="flex h-full w-full items-center justify-center text-center text-xs text-white/40 p-1">
        אין תמונה
      </span>
    );
  }

  return <img src={src} alt={alt} className={className} loading={loading}
    onError={() => setFailed(true)} />;
}
