import { NextRequest, NextResponse } from "next/server";
import { lookupTransactionWithRetry, TRANZILA_SUCCESS_CODES, hebrewMessageForCode, tranzilaEnv, sanitizeForLog } from "@/lib/tranzila";
import { notifyOrderPaid } from "@/lib/orderNotify";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

const RPC_SECRET = process.env.TRANZILA_WEBHOOK_SECRET;

/**
 * Called by the browser right after TzlaHostedFields' charge() callback returns.
 * The browser's report of success is NEVER trusted on its own — this route
 * independently re-fetches the transaction from Tranzila's Track Transaction
 * Data API before flipping the order to "paid".
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "בקשה לא תקינה" }, { status: 400 });
  }

  const orderId = String(body?.orderId ?? "");
  const transactionId = String(body?.transactionId ?? "");
  const displayCardBrand = body?.cardBrand ? String(body.cardBrand).slice(0, 40) : null;
  const displayLast4 = body?.last4 && /^\d{4}$/.test(String(body.last4)) ? String(body.last4) : null;
  const installments = Number.isFinite(Number(body?.installments)) ? Number(body.installments) : null;
  // Client-reported Tranzila processor_response_code — used ONLY to pick a more
  // accurate failure message / log line below. Never used to decide `success`;
  // that still requires our own independent lookupTransaction() confirmation.
  const clientProcessorCode = /^\d{1,4}$/.test(String(body?.processorCode ?? "")) ? String(body.processorCode) : null;

  if (!orderId || !transactionId) {
    return NextResponse.json({ ok: false, message: "חסרים פרטי עסקה" }, { status: 400 });
  }
  if (!RPC_SECRET) {
    console.error("TRANZILA_WEBHOOK_SECRET not configured — cannot confirm payments");
    return NextResponse.json({ ok: false, message: "שגיאת הגדרות שרת" }, { status: 500 });
  }

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) {
    return NextResponse.json({ ok: false, message: "הזמנה לא נמצאה" }, { status: 404 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json({ ok: true, message: "התשלום כבר אושר" });
  }

  let tracked;
  try {
    tracked = await lookupTransactionWithRetry(transactionId);
  } catch (e) {
    console.error("tranzila lookup failed:", sanitizeForLog(String(e)));
    // Outcome is genuinely unknown here — Tranzila may have approved the charge
    // even though we couldn't reach the lookup API to confirm it. Record this
    // on the order (without touching payment_status, so a legitimate retry
    // still works) so it isn't silently lost — an unreconciled charge with no
    // trace anywhere is the real risk, not just a UI error message.
    await supabase
      .from("orders")
      .update({
        payment_attempts: (order.payment_attempts ?? 0) + 1,
        last_payment_error: sanitizeForLog(`verify_lookup_error transactionId=${transactionId} :: ${String(e)}`),
      })
      .eq("id", orderId)
      .eq("payment_status", "pending");
    return NextResponse.json(
      { ok: false, message: "לא ניתן לאמת את העסקה כרגע. אם נגבה סכום בכרטיס, אל תנסה/י שוב לפני בדיקת מצב ההזמנה — פנה/י אלינו לבדיקה." },
      { status: 502 }
    );
  }

  const status = tracked?.transtatus != null ? String(tracked.transtatus) : undefined;
  const amountOk = tracked ? Math.abs(Number(tracked.amount) - Number(order.total)) < 0.01 : false;
  const success = !!tracked && status !== undefined && TRANZILA_SUCCESS_CODES.has(status) && amountOk;

  if (!success) {
    const { error: rpcError } = await supabase.rpc("mark_tranzila_payment_failed", {
      p_secret: RPC_SECRET,
      p_order_id: orderId,
      p_error: sanitizeForLog(
        `verify_failed status=${status ?? "none"} clientCode=${clientProcessorCode ?? "none"} amountOk=${amountOk}`
      ),
    });
    if (rpcError) console.error("mark_tranzila_payment_failed RPC error:", sanitizeForLog(rpcError.message));
    return NextResponse.json({ ok: false, message: hebrewMessageForCode(status ?? clientProcessorCode ?? undefined) });
  }

  const { data: confirmed, error: confirmError } = await supabase.rpc("confirm_tranzila_payment", {
    p_secret: RPC_SECRET,
    p_order_id: orderId,
    p_transaction_id: transactionId,
    p_auth_number: tracked!.authorization_number ?? null,
    p_amount: Number(tracked!.amount),
    p_currency: "ILS",
    p_card_brand: displayCardBrand,
    p_last4: displayLast4,
    p_installments: installments,
    p_env: tranzilaEnv(),
  });

  if (confirmError) console.error("confirm_tranzila_payment RPC error:", sanitizeForLog(confirmError.message));

  if (!confirmed) {
    // Either already processed by the notify webhook, or a genuine race — check current state.
    const { data: refreshed } = await supabase.from("orders").select("payment_status").eq("id", orderId).maybeSingle();
    if (refreshed?.payment_status === "paid") {
      return NextResponse.json({ ok: true, message: "התשלום אושר בהצלחה." });
    }
    return NextResponse.json({ ok: false, message: "אירעה שגיאה באישור התשלום." }, { status: 500 });
  }

  await notifyOrderPaid(req, order);
  return NextResponse.json({ ok: true, message: "התשלום אושר בהצלחה." });
}
