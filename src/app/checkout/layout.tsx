import type { Metadata } from "next";

// Checkout is per-session; keep it out of search results.
export const metadata: Metadata = { title: "קופה", robots: { index: false, follow: false } };

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
