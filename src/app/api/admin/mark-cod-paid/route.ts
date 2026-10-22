import { NextRequest, NextResponse } from "next/server";
import { adminEmail } from "@/lib/adminAuth";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

/**
 * Admin confirms the courier collected the money for a cash-on-delivery order.
 * The only way a COD order becomes "paid"; the RPC records who and when.
 */
export async function POST(req: NextRequest) {
  const email = adminEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "חסר מזהה הזמנה" }, { status: 400 });
  }

  const { data: ok, error } = await supabase.rpc("mark_cod_paid", { p_order_id: orderId, p_admin_email: email });
  if (error) {
    console.error("mark_cod_paid RPC error:", error.message);
    return NextResponse.json({ error: "עדכון התשלום נכשל" }, { status: 500 });
  }
  if (!ok) {
    return NextResponse.json({ error: "ניתן לסמן רק הזמנת תשלום לשליח שממתינה לתשלום" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
