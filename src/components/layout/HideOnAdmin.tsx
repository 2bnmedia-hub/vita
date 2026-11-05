"use client";
import { usePathname } from "next/navigation";

/** Store chrome (navbar, footer, cart) is not rendered inside the admin area. */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
