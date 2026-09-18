import { NextRequest, NextResponse } from "next/server";
import { lookupTransactionWithRetry, TRANZILA_SUCCESS_CODES, tranzilaEnv, sanitizeForLog } from "@/lib/tranzila";
import { notifyOrderPaid } from "@/lib/orderNotify";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

const RPC_SECRET = process.env.TRANZILA_WEBHOOK_SECRET;

/**
 * Backup/async confirmation path. Configure this exact URL as the terminal's
 * Notify URL in my.tranzila (see deployment notes) — including the ?ws=
 * secret, which is our own shared-secret gate since Tranzila's notify
 * payload isn't cryptographically signed per their docs.
 *
 * The primary confirmation path is POST /api/checkout/verify, called by the
 * browser right after a successful charge() and backed by the fully
 * documented Track Transaction Data API. This route exists to still close
 * the order if the browser tab is closed before that call fires. Whichever
 * path arrives first wins — confirm_tranzila_payment() is idempotent on
 * transaction_id via a DB unique constraint, so this can never double-charge
 * or double-fulfil an order.
 */
export async function POST(req: NextRequest) {
  const providedSecret = req.nextUrl.searchParams.get("ws");
  if (!RPC_SECRET || providedSecret !== RPC_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let fields: Record<string, string> = {};
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      fields = await req.json();
    } else {
      const form = await req.formData();
      form.forEach((v, k) => { fields[k] = String(v); });
    }
  } catch (e) {
    console.error("notify: could not parse body", sanitizeForLog(String(e)));
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const myOrderId = fields.myid || fields.order_id || null;
  const transactionId =
    fields.transaction_id || fields.TranzilaTK || fields.index || fields.ConfirmationCode || null;
  const reportedAmount = fields.sum ? Number(fields.sum) : null;

  let order: Record<string, any> | null = null;

  if (myOrderId) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", myOrderId)
      .maybeSingle();
    order = data ?? null;
  }

  // Documented fallback (Tranzila's own notify-page guidance): match the
  // most recent still-pending order with a matching amount.
  if (!order && reportedAmount != null) {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("payment_status", "pending")
      .gte("created_at", thirtyMinAgo)
      .order("created_at", { ascending: false });
    order = (data ?? []).find((o) => Math.abs(Number(o.total) - reportedAmount) < 0.01) ?? null;
  }

  if (!order || !transactionId) {
    console.error("notify: could not match order", sanitizeForLog(fields));
    return new NextResponse("OK", { status: 200 }); // ack anyway — nothing to retry into
  }

  if (order.payment_status !== "pending") {
    return new NextResponse("OK", { status: 200 });
  }

  // Never trust the posted Response field alone — reconcile server-to-server.
  let tracked;
  try {
    tracked = await lookupTransactionWithRetry(String(transactionId));
  } catch (e) {
    console.error("notify: lookup failed", sanitizeForLog(String(e)));
    // Same ambiguous-outcome gap as /api/checkout/verify: don't let this
    // vanish untraced. payment_status is left untouched (still 'pending') —
    // Tranzila's own webhook retry, or the browser's verify call, may still
    // resolve it correctly.
    await supabase
      .from("orders")
      .update({
        payment_attempts: (order.payment_attempts ?? 0) + 1,
        last_payment_error: sanitizeForLog(`notify_lookup_error transactionId=${transactionId} :: ${String(e)}`),
      })
      .eq("id", order.id)
      .eq("payment_status", "pending");
    return new NextResponse("OK", { status: 200 });
  }

  const status = tracked?.transtatus != null ? String(tracked.transtatus) : undefined;
  const amountOk = tracked ? Math.abs(Number(tracked.amount) - Number(order.total)) < 0.01 : false;
  const success = !!tracked && status !== undefined && TRANZILA_SUCCESS_CODES.has(status) && amountOk;

  if (success && RPC_SECRET) {
    const { data: confirmed, error: rpcError } = await supabase.rpc("confirm_tranzila_payment", {
      p_secret: RPC_SECRET,
      p_order_id: order.id,
      p_transaction_id: String(transactionId),
      p_auth_number: tracked!.authorization_number ?? null,
      p_amount: Number(tracked!.amount),
      p_currency: "ILS",
      p_card_brand: null,
      p_last4: null,
      p_installments: null,
      p_env: tranzilaEnv(),
    });
    if (rpcError) console.error("notify: confirm_tranzila_payment RPC error:", sanitizeForLog(rpcError.message));
    // Only notify if THIS call won the idempotent claim — otherwise /api/checkout/verify
    // already confirmed it and already sent the emails; sending again would double-notify.
    else if (confirmed) await notifyOrderPaid(req, order);
  } else if (RPC_SECRET) {
    const { error: rpcError } = await supabase.rpc("mark_tranzila_payment_failed", {
      p_secret: RPC_SECRET,
      p_order_id: order.id,
      p_error: sanitizeForLog(`notify_failed status=${status ?? "none"} amountOk=${amountOk}`),
    });
    if (rpcError) console.error("notify: mark_tranzila_payment_failed RPC error:", sanitizeForLog(rpcError.message));
  }

  return new NextResponse("OK", { status: 200 });
}
