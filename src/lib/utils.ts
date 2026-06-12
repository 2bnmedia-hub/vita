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
