import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizeForLog } from "@/lib/tranzila";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const RPC_SECRET = process.env.TRANZILA_WEBHOOK_SECRET;

/**
 * The TzlaHostedFields charge() call runs entirely inside the browser/iframe —
 * when it fails there, nothing ever reaches our server or Vercel logs. This
 * route lets the client hand us the (sanitized) failure so it's visible
 * server-side, tagged with the order's correlation id, without ever
 * accepting or logging card data.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const orderId = String(body?.orderId ?? "");
  const stage = String(body?.stage ?? "unknown").slice(0, 60);
  const kind = String(body?.kind ?? "unknown").slice(0, 60);
  const detail = sanitizeForLog(body?.detail ?? "");

  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  console.error(`[checkout:client-error] order=${orderId} stage=${stage} kind=${kind} detail=${detail}`);

  if (RPC_SECRET) {
    const { error: rpcError } = await supabase.rpc("mark_tranzila_payment_failed", {
      p_secret: RPC_SECRET,
      p_order_id: orderId,
      p_error: sanitizeForLog(`client_error stage=${stage} kind=${kind} detail=${detail}`),
    });
    if (rpcError) console.error("report-client-error: RPC error:", sanitizeForLog(rpcError.message));
  }

  return NextResponse.json({ ok: true });
}
