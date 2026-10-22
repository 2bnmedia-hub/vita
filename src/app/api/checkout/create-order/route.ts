import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { SHIPPING_COST, SHIPPING_LABEL, isPaymentMethod, isShippingRegion } from "@/lib/shipping";
import { createHandshake, tranzilaTerminal, sanitizeForLog } from "@/lib/tranzila";
import { priceOrder } from "@/lib/orderPricing";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { COUPON_MESSAGES, normalizeCouponCode, reserveCoupon } from "@/lib/coupons";
import { notifyCodOrderPlaced } from "@/lib/orderNotify";

const MAX_OPEN_COD_ORDERS = 2;

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
  // Missing = card, so older clients keep working unchanged.
  const paymentMethod = body?.paymentMethod ?? "card";
  if (!isPaymentMethod(paymentMethod)) {
    return NextResponse.json({ error: "אמצעי תשלום לא תקין" }, { status: 400 });
  }
  if (paymentMethod === "cod" && shippingRegion === "pickup") {
    return NextResponse.json({ error: "תשלום לשליח זמין למשלוח בלבד" }, { status: 400 });
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
    if ((existing.payment_method ?? "card") !== paymentMethod) {
      return NextResponse.json({ error: "אמצעי התשלום השתנה. רענן/י את העמוד ונסה/י שוב." }, { status: 409 });
    }
    // A COD order is complete once placed: a retry just gets the same order back.
    if (paymentMethod === "cod") {
      if (existing.payment_status !== "cod_pending") {
        return NextResponse.json(
          { error: "ההזמנה הזו כבר טופלה", orderNumber: existing.order_number, paymentStatus: existing.payment_status },
          { status: 409 }
        );
      }
      return NextResponse.json({
        orderId: existing.id,
        orderNumber: existing.order_number,
        amount: Number(existing.total),
        paymentMethod: "cod",
        paymentStatus: "cod_pending",
      });
    }
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

  // COD holds stock without any payment, so one customer may only have a few
  // unpaid COD orders open at a time (stops an anonymous script draining stock).
  if (paymentMethod === "cod") {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "cod_pending")
      .or(`customer_email.eq.${JSON.stringify(email)},customer_phone.eq.${JSON.stringify(phone)}`);
    if ((count ?? 0) >= MAX_OPEN_COD_ORDERS) {
      return NextResponse.json(
        { error: "קיימות כבר הזמנות פתוחות לתשלום לשליח. נא לפנות אלינו או לשלם באשראי." },
        { status: 429 }
      );
    }
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

  // Coupon: availability and terms come from the DB, never from the client.
  // This first call only checks; the reservation itself happens once the order exists.
  const couponCode = normalizeCouponCode(body?.couponCode);
  let couponRule = null;
  let couponTerms: string | null = null;
  if (couponCode) {
    const coupon = await reserveCoupon(couponCode, null);
    if (coupon.status !== "ok") {
      return NextResponse.json({ error: COUPON_MESSAGES[coupon.status], couponStatus: coupon.status }, { status: 409 });
    }
    couponRule = coupon.rule;
    couponTerms = coupon.terms;
  }

  const pricing = priceOrder(items as RequestItem[], products, shippingRegion, couponRule);
  if (!pricing.ok) {
    const err = pricing.error;
    if (err.code === "unknown_product") return NextResponse.json({ error: "אחד המוצרים בסל אינו קיים יותר" }, { status: 400 });
    if (err.code === "invalid_quantity") return NextResponse.json({ error: "פריט לא תקין בסל" }, { status: 400 });
    if (err.code === "out_of_stock") return NextResponse.json({ error: `המוצר "${err.productName}" אזל מהמלאי` }, { status: 409 });
    return NextResponse.json({ error: `המוצר "${err.productName}" זמין רק בכמות ${err.available}` }, { status: 409 });
  }
  // A coupon the cart doesn't qualify for (e.g. too few eligible units) is
  // refused rather than silently stored on a full-price order.
  if (couponCode && pricing.discount <= 0) {
    return NextResponse.json(
      { error: couponTerms || COUPON_MESSAGES.not_eligible, couponStatus: "not_eligible" },
      { status: 409 }
    );
  }
  const { items: orderItems, total } = pricing;
  const shippingCost = SHIPPING_COST[shippingRegion];
  const orderNumber = makeOrderNumber();
  const isCod = paymentMethod === "cod";

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
        // Card orders leave payment_method to its DB default ('card'), so the
        // card path never depends on the COD migration being applied.
        ...(isCod ? { payment_method: "cod" } : {}),
        payment_status: isCod ? "cod_pending" : "pending",
        payment_provider: isCod ? null : "tranzila",
        payment_terminal: isCod ? null : tranzilaTerminal(),
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
    if (isCod) {
      return NextResponse.json({ error: "תשלום לשליח אינו זמין כרגע. נא לבחור אזור משלוח ולשלם באשראי, או לפנות אלינו." }, { status: 503 });
    }
    return NextResponse.json({ error: "יצירת ההזמנה נכשלה. נסה/י שוב." }, { status: 500 });
  }

  // Atomic reservation: of two simultaneous checkouts with the same coupon,
  // only one gets past this line. The loser's order is closed unpaid.
  if (couponCode) {
    const reserved = await reserveCoupon(couponCode, order.id);
    if (reserved.status !== "ok") {
      if (isCod) {
        await supabase.rpc("cancel_cod_order", { p_order_id: order.id, p_reason: `coupon_${reserved.status}` });
      } else {
        await supabase
          .from("orders")
          .update({ payment_status: "payment_failed", last_payment_error: `coupon_${reserved.status}` })
          .eq("id", order.id);
      }
      return NextResponse.json({ error: COUPON_MESSAGES[reserved.status], couponStatus: reserved.status }, { status: 409 });
    }
  }

  // COD: no Tranzila at all. The order goes straight to fulfillment, so its
  // stock (and coupon) is taken now, atomically, and given back on cancel.
  if (isCod) {
    const { data: allocated, error: allocError } = await supabase.rpc("allocate_cod_order", { p_order_id: order.id });
    if (allocError || allocated !== "ok") {
      await supabase.rpc("cancel_cod_order", { p_order_id: order.id, p_reason: `allocate_${allocated ?? "error"}` });
      if (allocError) console.error("allocate_cod_order failed:", sanitizeForLog(allocError.message));
      return allocated === "insufficient_stock"
        ? NextResponse.json({ error: "אחד המוצרים בסל אזל מהמלאי. רענן/י את העמוד ונסה/י שוב." }, { status: 409 })
        : NextResponse.json({ error: "יצירת ההזמנה נכשלה. נסה/י שוב." }, { status: 500 });
    }
    await notifyCodOrderPlaced(req, order);
    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      amount: total,
      discount: pricing.discount,
      currency: "ILS",
      paymentMethod: "cod",
      paymentStatus: "cod_pending",
    });
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
