import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return `₪${price.toLocaleString("he-IL")}`;
}

export function calcDiscount(price: number, compare: number): number {
  return Math.round(((compare - price) / compare) * 100);
}

/** Products with this badge are listed first (rightmost in RTL) and get a flame icon. */
export const BESTSELLER_BADGE = "הנמכר ביותר";

/** Stable: keeps the query's order otherwise. */
export function bestsellersFirst<T extends { badge?: string | null }>(products: T[]): T[] {
  return [...products].sort((a, b) => Number(b.badge === BESTSELLER_BADGE) - Number(a.badge === BESTSELLER_BADGE));
}
