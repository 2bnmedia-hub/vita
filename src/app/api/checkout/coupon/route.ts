import { NextRequest, NextResponse } from "next/server";
import { COUPON_MESSAGES, normalizeCouponCode, reserveCoupon } from "@/lib/coupons";

/**
 * Read-only coupon check for the checkout summary. Reserves nothing — the
 * binding check and the reservation happen in /api/checkout/create-order.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "בקשה לא תקינה" }, { status: 400 });
  }

  const code = normalizeCouponCode(body?.code);
  if (!code) {
    return NextResponse.json({ ok: false, status: "invalid", message: COUPON_MESSAGES.invalid });
  }

  try {
    const { status, percent } = await reserveCoupon(code, null);
    return NextResponse.json({ ok: status === "ok", status, message: COUPON_MESSAGES[status], percent: status === "ok" ? percent : 0 });
  } catch (e) {
    console.error("coupon check failed:", String(e).slice(0, 200));
    return NextResponse.json({ ok: false, message: "לא ניתן לבדוק את הקופון כרגע. נסה/י שוב." }, { status: 500 });
  }
}
