import { NextRequest } from "next/server";
import { sendCustomerEmail, sendOwnerOrderEmail } from "@/lib/email";

/**
 * Fires the two confirmation emails (owner alert + customer receipt) the
 * instant an order actually flips to "paid". Called from both /api/checkout/verify
 * and /api/tranzila/notify — whichever one wins the idempotent RPC claim is the
 * only one that will ever see `confirmed === true`, so this never double-sends.
 *
 * Awaited (not fire-and-forget): a serverless function can be frozen the
 * moment its response is sent, so an un-awaited send here is not guaranteed
 * to complete. Sends run in-process (no loopback HTTP to a Host-derived URL,
 * no shared secret on the wire); failures only log, never throw.
 */
export async function notifyOrderPaid(_req: NextRequest, order: Record<string, any>) {
  await Promise.allSettled([
    sendOwnerOrderEmail(order),
    sendCustomerEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      orderId: order.id,
      message: `תודה על הזמנתך! ההזמנה מספר ${order.order_number ?? ""} בסך ₪${order.total} התקבלה והתשלום אושר בהצלחה. נעדכן אותך בהמשך לגבי המשלוח.`,
    }),
  ]);
}

/**
 * Same two emails for a cash-on-delivery order, sent once when it is placed
 * (nothing is paid yet, so the customer text never says the payment was approved).
 */
export async function notifyCodOrderPlaced(_req: NextRequest, order: Record<string, any>) {
  await Promise.allSettled([
    sendOwnerOrderEmail(order),
    sendCustomerEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      orderId: order.id,
      message: `תודה על הזמנתך! ההזמנה מספר ${order.order_number ?? ""} התקבלה.\nאמצעי תשלום: תשלום לשליח.\nסכום לגבייה בעת המסירה (כולל משלוח): ₪${order.total}.\nסטטוס תשלום: ממתין לתשלום לשליח.\nנעדכן אותך בהמשך לגבי המשלוח.`,
    }),
  ]);
}
