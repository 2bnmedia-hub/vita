import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

// Server-only (service role). The rules themselves live in the DB function
// reserve_coupon() — see supabase-coupons-migration.sql.

export type CouponStatus = "ok" | "invalid" | "redeemed" | "reserved";

export const COUPON_MESSAGES: Record<CouponStatus, string> = {
  ok: "הקופון הוחל בהצלחה.",
  invalid: "קוד הקופון אינו תקין.",
  redeemed: "הקופון כבר מומש ואינו זמין עוד.",
  reserved: "הקופון נמצא כרגע בתהליך תשלום של לקוח אחר. נסה/י שוב מאוחר יותר.",
};

/** Codes are case-insensitive; one code per order (no stacking). */
export function normalizeCouponCode(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 40) : "";
}

/**
 * orderId null → availability check only. With an orderId the coupon is
 * atomically reserved for that order (or refreshed if it already holds it).
 */
export async function reserveCoupon(code: string, orderId: string | null): Promise<{ status: CouponStatus; percent: number }> {
  const { data: coupon } = await supabase.from("coupons").select("percent_off").eq("code", code).maybeSingle();
  if (!coupon) return { status: "invalid", percent: 0 };

  const { data, error } = await supabase.rpc("reserve_coupon", { p_code: code, p_order_id: orderId });
  if (error) throw new Error(`reserve_coupon failed: ${error.message}`);
  return { status: data as CouponStatus, percent: Number(coupon.percent_off) };
}
