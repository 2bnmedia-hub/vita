import { Resend } from "resend";

/** Escape customer-typed text before it goes into an HTML email. */
const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const OWNER_EMAIL = "vformnutrition@gmail.com";
const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

type SendResult = { ok: true } | { ok: false; error: string };

async function send(msg: { from: string; to: string; subject: string; html: string }, tag: string): Promise<SendResult> {
  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send(msg);
    if (error) {
      console.error(`${tag} rejected by Resend:`, error);
      return { ok: false, error: error.message ?? "failed to send email" };
    }
    return { ok: true };
  } catch (err) {
    console.error(`${tag} failed`, err);
    return { ok: false, error: "failed to send email" };
  }
}

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

/** New-order alert to the shop owner. Fixed recipient. */
export function sendOwnerOrderEmail(order: Record<string, any>): Promise<SendResult> {
  const itemsHtml = ((order.items ?? []) as OrderItem[])
    .map(
      (i) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;">${esc(i.name)}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;">${esc(i.quantity)}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;">₪${esc(i.price)}</td></tr>`
    )
    .join("");

  const html = `
    <div dir="rtl" style="font-family:sans-serif;">
      <h2>הזמנה חדשה — VITA / V-FORM</h2>
      <p><b>שם:</b> ${esc(order.customer_name)}</p>
      <p><b>אימייל:</b> ${esc(order.customer_email)}</p>
      <p><b>טלפון:</b> ${esc(order.customer_phone ?? "-")}</p>
      <p><b>כתובת:</b> ${esc(order.address)}</p>
      <p><b>אזור משלוח:</b> ${esc(order.shipping_region)} (₪${esc(order.shipping_cost)})</p>
      ${order.notes ? `<p><b>הערות:</b> ${esc(order.notes)}</p>` : ""}
      <table style="border-collapse:collapse;margin-top:10px;">
        <thead><tr><th style="text-align:right;padding:6px 10px;">מוצר</th><th style="text-align:right;padding:6px 10px;">כמות</th><th style="text-align:right;padding:6px 10px;">מחיר</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      ${order.coupon_code ? `<p><b>קופון:</b> ${esc(order.coupon_code)} (הנחה ₪${esc(order.discount_amount)})</p>` : ""}
      <p style="margin-top:14px;font-size:16px;"><b>סה"כ: ₪${esc(order.total)}</b></p>
      ${order.payment_method === "cod"
        ? `<p><b>אמצעי תשלום:</b> תשלום לשליח</p><p><b>סכום לגבייה בעת המסירה:</b> ₪${esc(order.total)}</p><p><b>סטטוס תשלום:</b> ממתין לתשלום לשליח</p>`
        : ""}
    </div>
  `;

  return send(
    { from: "VITA Orders <onboarding@resend.dev>", to: OWNER_EMAIL, subject: `הזמנה חדשה מ-${esc(order.customer_name)}`, html },
    "owner-order-email"
  );
}

/** Message to a customer. Callers must be trusted server code or an authenticated admin route. */
export function sendCustomerEmail(p: { to: unknown; customerName?: unknown; message: unknown; orderId?: unknown }): Promise<SendResult> {
  if (typeof p.to !== "string" || !EMAIL_RE.test(p.to) || typeof p.message !== "string" || !p.message.trim() || p.message.length > 5000) {
    return Promise.resolve({ ok: false, error: "missing to/message" });
  }
  const html = `
    <div dir="rtl" style="font-family:sans-serif;background:#0B1929;padding:32px;">
      <div style="max-width:480px;margin:0 auto;background:#0F2238;border-radius:16px;padding:28px;border:1px solid rgba(0,212,255,0.15);">
        <h2 style="color:#fff;margin:0 0 4px;">V-FORM NUTRITION</h2>
        <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0 0 20px;">עדכון להזמנה שלך${p.orderId ? ` #${esc(String(p.orderId).slice(0, 8))}` : ""}</p>
        <p style="color:#fff;font-size:15px;">שלום ${esc(p.customerName ?? "")},</p>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;white-space:pre-wrap;">${esc(p.message)}</p>
        <p style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:24px;">תודה שבחרת ב-V-FORM NUTRITION</p>
      </div>
    </div>
  `;
  return send(
    { from: "V-FORM NUTRITION <onboarding@resend.dev>", to: p.to, subject: "עדכון להזמנתך — V-FORM NUTRITION", html },
    "customer-email"
  );
}
