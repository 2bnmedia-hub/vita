import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ALLOWED_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { status } = await req.json();
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // An unpaid COD order holds stock: cancelling it goes through the RPC that
  // gives the stock (and coupon) back exactly once. Once cancelled it stays
  // cancelled — reopening would ship goods whose stock was already returned.
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("payment_method, payment_status, status")
    .eq("id", params.id)
    .maybeSingle();
  if (order?.payment_method === "cod") {
    if (order.status === "cancelled" && status !== "cancelled") {
      return NextResponse.json({ error: "לא ניתן לפתוח מחדש הזמנת תשלום לשליח שבוטלה" }, { status: 409 });
    }
    if (status === "cancelled" && order.payment_status === "cod_pending") {
      const { error } = await supabaseAdmin.rpc("cancel_cod_order", { p_order_id: params.id, p_reason: "admin_cancelled" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
  }

  // Fulfillment status only — payment_status is never writable here (that
  // column can only move via the verified Tranzila RPC path; the DB trigger
  // enforces this too, so this check is belt-and-suspenders).
  const { error } = await supabaseAdmin.from("orders").update({ status }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Give back the stock an unpaid COD order holds before it disappears.
  await supabaseAdmin.rpc("cancel_cod_order", { p_order_id: params.id, p_reason: "admin_deleted" });
  const { error } = await supabaseAdmin.from("orders").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
