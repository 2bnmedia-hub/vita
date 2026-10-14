import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import type { CouponRule } from "@/lib/orderPricing";

// Server-only (service role). The rules themselves live in the DB function
// reserve_coupon() — see supabase-coupons-migration.sql.

export type CouponStatus = "ok" | "invalid" | "redeemed" | "reserved" | "not_eligible";

export const COUPON_MESSAGES: Record<CouponStatus, string> = {
  ok: "הקופון הוחל בהצלחה.",
  invalid: "קוד הקופון אינו תקין.",
  redeemed: "הקופון כבר מומש ואינו זמין עוד.",
  reserved: "הקופון נמצא כרגע בתהליך תשלום של לקוח אחר. נסה/י שוב מאוחר יותר.",
  not_eligible: "הסל אינו עומד בתנאי הקופון.",
};

/** Codes are case-insensitive; one code per order (no stacking). */
export function normalizeCouponCode(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 40) : "";
}

/**
 * orderId null → availability check only. With an orderId the coupon is
 * atomically reserved for that order (or refreshed if it already holds it).
 */
export async function reserveCoupon(
  code: string,
  orderId: string | null
): Promise<{ status: CouponStatus; rule: CouponRule | null; terms: string | null }> {
  const { data: c } = await supabase
    .from("coupons")
    .select("percent_off, amount_off, product_id, min_quantity, terms_message")
    .eq("code", code)
    .maybeSingle();
  if (!c) return { status: "invalid", rule: null, terms: null };

  const { data, error } = await supabase.rpc("reserve_coupon", { p_code: code, p_order_id: orderId });
  if (error) throw new Error(`reserve_coupon failed: ${error.message}`);
  const rule: CouponRule = {
    percentOff: c.percent_off == null ? null : Number(c.percent_off),
    amountOff: c.amount_off == null ? null : Number(c.amount_off),
    productId: c.product_id ?? null,
    minQuantity: Number(c.min_quantity ?? 1),
  };
  return { status: data as CouponStatus, rule, terms: c.terms_message ?? null };
}
