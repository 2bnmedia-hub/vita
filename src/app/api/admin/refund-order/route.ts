import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthed } from "@/lib/adminAuth";
import { refundTransaction, sanitizeForLog } from "@/lib/tranzila";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const RPC_SECRET = process.env.TRANZILA_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!RPC_SECRET) {
    return NextResponse.json({ error: "שגיאת הגדרות שרת" }, { status: 500 });
  }

  const { orderId, full } = await req.json();
  if (!orderId) {
    return NextResponse.json({ error: "חסר מזהה הזמנה" }, { status: 400 });
  }

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
  }
  if (!["paid", "partially_refunded"].includes(order.payment_status)) {
    return NextResponse.json({ error: "ניתן לזכות רק הזמנה ששולמה" }, { status: 409 });
  }
  if (!order.tranzila_transaction_id || !order.tranzila_confirmation_code) {
    return NextResponse.json({ error: "חסרים פרטי עסקה מקוריים מ-Tranzila" }, { status: 409 });
  }

  const refundAmount = Number(order.total) - Number(order.refunded_amount ?? 0);
  const result = await refundTransaction({
    referenceTransactionId: order.tranzila_transaction_id,
    authorizationNumber: order.tranzila_confirmation_code,
    amount: refundAmount,
  });

  if (!result.ok) {
    console.error("refund failed:", sanitizeForLog(result.message));
    return NextResponse.json({ error: `הזיכוי נכשל מול Tranzila: ${result.message ?? "שגיאה"}` }, { status: 502 });
  }

  const { error: rpcError } = await supabase.rpc("record_tranzila_refund", {
    p_secret: RPC_SECRET,
    p_order_id: orderId,
    p_amount: refundAmount,
    p_full: full !== false,
    p_auth_number: result.authNumber ?? null,
  });
  if (rpcError) {
    console.error("record_tranzila_refund RPC error:", sanitizeForLog(rpcError.message));
    return NextResponse.json({ error: "הזיכוי בוצע מול Tranzila אך עדכון הרשומה נכשל — יש לבדוק ידנית" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
