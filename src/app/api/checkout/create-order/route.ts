import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { SHIPPING_COST, SHIPPING_LABEL, isShippingRegion } from "@/lib/shipping";
import { createHandshake, tranzilaTerminal, sanitizeForLog } from "@/lib/tranzila";
import { priceOrder } from "@/lib/orderPricing";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  const pricing = priceOrder(items as RequestItem[], products, shippingRegion);
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
      },
    ])
    .select()
    .single();

  if (insertError || !order) {
    console.error("create-order insert failed:", sanitizeForLog(insertError?.message));
    return NextResponse.json({ error: "יצירת ההזמנה נכשלה. נסה/י שוב." }, { status: 500 });
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
    currency: "ILS",
    terminalName: tranzilaTerminal(),
    thtk: handshake.thtk,
  });
}
