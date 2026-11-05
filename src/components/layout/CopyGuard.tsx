"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Copy/save DETERRENCE for public marketing content — not protection: the text stays in the
 * HTML (SEO, screen readers) and anyone can still copy it via devtools or view-source.
 * Single off switch: set COPY_GUARD_ENABLED to false.
 * Styles: `html[data-copy-guard="on"]` rules in globals.css.
 */
export const COPY_GUARD_ENABLED = true;

// Only marketing pages. Forms, account, checkout, admin, contact and policy pages stay copyable.
const GUARDED = (p: string) => p === "/" || p === "/shop" || p.startsWith("/shop/");

export function CopyGuard() {
  const pathname = usePathname() ?? "";
  const on = COPY_GUARD_ENABLED && GUARDED(pathname);

  useEffect(() => {
    const html = document.documentElement;
    if (!on) { delete html.dataset.copyGuard; return; }
    html.dataset.copyGuard = "on";
    // Images inside <main> only: no drag-out, no "Save image as" menu. Right-click elsewhere is untouched.
    const onImage = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t?.tagName === "IMG" && t.closest("main") && !t.closest(".copy-ok")) e.preventDefault();
    };
    document.addEventListener("contextmenu", onImage);
    document.addEventListener("dragstart", onImage);
    return () => {
      delete html.dataset.copyGuard;
      document.removeEventListener("contextmenu", onImage);
      document.removeEventListener("dragstart", onImage);
    };
  }, [on]);

  return null;
}
