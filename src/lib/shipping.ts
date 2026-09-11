import type { ShippingRegion } from "@/types";

export const SHIPPING_COST: Record<ShippingRegion, number> = {
  north: 29,
  center: 39,
  south: 49,
  pickup: 0,
};

export const SHIPPING_LABEL: Record<ShippingRegion, string> = {
  north: "צפון",
  center: "מרכז",
  south: "דרום ואילת",
  pickup: "איסוף עצמי",
};

export function isShippingRegion(v: unknown): v is ShippingRegion {
  return v === "north" || v === "center" || v === "south" || v === "pickup";
}
