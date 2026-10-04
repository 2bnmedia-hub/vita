import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { SHIPPING_COST, SHIPPING_LABEL, isShippingRegion } from "@/lib/shipping";
import { createHandshake, tranzilaTerminal, sanitizeForLog } from "@/lib/tranzila";
import { priceOrder } from "@/lib/orderPricing";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { COUPON_MESSAGES, normalizeCouponCode, reserveCoupon } from "@/lib/coupons";

interface RequestItem {
  product_id: string;
  quantity: number;
}

function makeOrderNumber(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `VF-${t}${r}`;
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const { items, customer, shippingRegion, idempotencyKey } = body ?? {};

  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    return NextResponse.json({ error: "חסר מזהה בקשה" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "הסל ריק" }, { status: 400 });
  }
  if (!isShippingRegion(shippingRegion)) {
    return NextResponse.json({ error: "אזור משלוח לא תקין" }, { status: 400 });
  }
  const name = String(customer?.name ?? "").trim();
  const email = String(customer?.email ?? "").trim();
  const phone = String(customer?.phone ?? "").trim();
  const address = String(customer?.address ?? "").trim();
  const city = String(customer?.city ?? "").trim();
  const zip = String(customer?.zip ?? "").trim();
  const notes = String(customer?.notes ?? "").trim();
  const agreedToTerms = customer?.agreedToTerms === true;

  if (!name || !email || !phone || !address || !city) {
    return NextResponse.json({ error: "נא למלא את כל שדות החובה" }, { status: 400 });
  }
  if (!agreedToTerms) {
    return NextResponse.json({ error: "יש לאשר את תנאי הרכישה וההחזרות" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "כתובת אימייל לא תקינה" }, { status: 400 });
  }

  // Idempotent retry: if this exact checkout attempt already created an order, reuse it
  // instead of creating a duplicate (covers double-submit, refresh, network retry).
  const { data: existing } = await supabase
    .from("orders")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    if (existing.payment_status !== "pending") {
      return NextResponse.json(
        { error: "ההזמנה הזו כבר טופלה", orderNumber: existing.order_number, paymentStatus: existing.payment_status },
        { status: 409 }
      );
    }
    // payment_attempts only rises on a still-pending order when a charge was
    // already sent to Tranzila and its result could not be confirmed. Opening a
    // new handshake here would let the same order be charged a second time.
    if ((existing.payment_attempts ?? 0) > 0) {
      return NextResponse.json(
        { error: "קיים תשלום בבדיקה עבור הזמנה זו. אין לבצע תשלום נוסף.", orderNumber: existing.order_number, paymentStatus: "pending" },
        { status: 409 }
      );
    }
    // The order was priced with a coupon: it may only go to payment while it
    // still holds that coupon's reservation.
    if (existing.coupon_code) {
      const held = await reserveCoupon(existing.coupon_code, existing.id);
      if (held.status !== "ok") {
        return NextResponse.json({ error: COUPON_MESSAGES[held.status], couponStatus: held.status }, { status: 409 });
      }
    }
    const handshake = await createHandshake(Number(existing.total), {
      order_id: existing.id,
      order_number: existing.order_number,
    });
    if (!handshake.ok) {
      return NextResponse.json({ error: "לא ניתן להתחיל תשלום כרגע. נסה/י שוב." }, { status: 502 });
    }
    return NextResponse.json({
      orderId: existing.id,
      orderNumber: existing.order_number,
      amount: Number(existing.total),
      currency: "ILS",
      terminalName: tranzilaTerminal(),
      thtk: handshake.thtk,
    });
  }

  // Re-price everything server-side from the DB. Never trust price/quantity from the client.
  const productIds = Array.from(new Set((items as RequestItem[]).map((i) => String(i.product_id))));
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, in_stock, stock_quantity")
    .in("id", productIds);

  if (productsError || !products || products.length !== productIds.length) {
    return NextResponse.json({ error: "אחד המוצרים בסל אינו קיים יותר" }, { status: 400 });
  }

  // Coupon: availability and percentage come from the DB, never from the client.
  // This first call only checks; the reservation itself happens once the order exists.
  const couponCode = normalizeCouponCode(body?.couponCode);
  let discountPercent = 0;
  if (couponCode) {
    const coupon = await reserveCoupon(couponCode, null);
    if (coupon.status !== "ok") {
      return NextResponse.json({ error: COUPON_MESSAGES[coupon.status], couponStatus: coupon.status }, { status: 409 });
    }
    discountPercent = coupon.percent;
  }

  const pricing = priceOrder(items as RequestItem[], products, shippingRegion, discountPercent);
  if (!pricing.ok) {
    const err = pricing.error;
    if (err.code === "unknown_product") return NextResponse.json({ error: "אחד המוצרים בסל אינו קיים יותר" }, { status: 400 });
    if (err.code === "invalid_quantity") return NextResponse.json({ error: "פריט לא תקין בסל" }, { status: 400 });
    if (err.code === "out_of_stock") return NextResponse.json({ error: `המוצר "${err.productName}" אזל מהמלאי` }, { status: 409 });
    return NextResponse.json({ error: `המוצר "${err.productName}" זמין רק בכמות ${err.available}` }, { status: 409 });
  }
  const { items: orderItems, total } = pricing;
  const shippingCost = SHIPPING_COST[shippingRegion];
  const orderNumber = makeOrderNumber();

  const { data: order, error: insertError } = await supabase
    .from("orders")
    .insert([
      {
        order_number: orderNumber,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        address,
        city,
        zip: zip || null,
        notes: notes || null,
        items: orderItems,
        total,
        shipping_region: SHIPPING_LABEL[shippingRegion],
        shipping_cost: shippingCost,
        status: "pending",
        payment_status: "pending",
        payment_provider: "tranzila",
        payment_terminal: tranzilaTerminal(),
        currency: "ILS",
        idempotency_key: idempotencyKey,
        payment_attempts: 0,
        coupon_code: couponCode || null,
        discount_amount: pricing.discount,
      },
    ])
    .select()
    .single();

  if (insertError || !order) {
    console.error("create-order insert failed:", sanitizeForLog(insertError?.message));
    return NextResponse.json({ error: "יצירת ההזמנה נכשלה. נסה/י שוב." }, { status: 500 });
  }

  // Atomic reservation: of two simultaneous checkouts with the same coupon,
  // only one gets past this line. The loser's order is closed unpaid.
  if (couponCode) {
    const reserved = await reserveCoupon(couponCode, order.id);
    if (reserved.status !== "ok") {
      await supabase
        .from("orders")
        .update({ payment_status: "payment_failed", last_payment_error: `coupon_${reserved.status}` })
        .eq("id", order.id);
      return NextResponse.json({ error: COUPON_MESSAGES[reserved.status], couponStatus: reserved.status }, { status: 409 });
    }
  }

  const handshake = await createHandshake(total, { order_id: order.id, order_number: orderNumber });
  if (!handshake.ok) {
    await supabase
      .from("orders")
      .update({ payment_status: "payment_failed", last_payment_error: "handshake_failed" })
      .eq("id", order.id);
    console.error("handshake failed:", sanitizeForLog(handshake.message));
    return NextResponse.json({ error: "לא ניתן להתחיל תשלום כרגע. נסה/י שוב." }, { status: 502 });
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber,
    amount: total,
    discount: pricing.discount,
    currency: "ILS",
    terminalName: tranzilaTerminal(),
    thtk: handshake.thtk,
  });
}
