import { NextRequest } from "next/server";

/**
 * Fires the two confirmation emails (owner alert + customer receipt) the
 * instant an order actually flips to "paid". Called from both /api/checkout/verify
 * and /api/tranzila/notify — whichever one wins the idempotent RPC claim is the
 * only one that will ever see `confirmed === true`, so this never double-sends.
 *
 * Awaited (not fire-and-forget): a serverless function can be frozen the
 * moment its response is sent, so an un-awaited fetch here is not guaranteed
 * to complete — the payment would confirm correctly but the receipt email
 * could silently never go out. A slow/failing email provider still can't
 * fail the payment response itself: both sends are wrapped so a rejection
 * only logs, never throws.
 */
export async function notifyOrderPaid(req: NextRequest, order: Record<string, any>) {
  const origin = req.nextUrl.origin;

  await Promise.allSettled([
    fetch(`${origin}/api/send-order-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    }).catch((e) => console.error("notifyOrderPaid: owner alert failed", e)),

    fetch(`${origin}/api/send-customer-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: order.customer_email,
        customerName: order.customer_name,
        orderId: order.id,
        message: `תודה על הזמנתך! ההזמנה מספר ${order.order_number ?? ""} בסך ₪${order.total} התקבלה והתשלום אושר בהצלחה. נעדכן אותך בהמשך לגבי המשלוח.`,
      }),
    }).catch((e) => console.error("notifyOrderPaid: customer receipt failed", e)),
  ]);
}
