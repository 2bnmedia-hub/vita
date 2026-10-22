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

/** "card" = Tranzila on the site; "cod" = paid to the courier on delivery (delivery regions only). */
export type PaymentMethod = "card" | "cod";

export function isPaymentMethod(v: unknown): v is PaymentMethod {
  return v === "card" || v === "cod";
}

export const COD_PAYMENT_LABEL = "תשלום לשליח";
export const COD_STATUS_LABEL = "ממתין לתשלום לשליח";
