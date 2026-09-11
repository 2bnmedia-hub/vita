import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const TO_EMAIL = "vformnutrition@gmail.com";

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export async function POST(req: NextRequest) {
  const order = await req.json();

  const itemsHtml = (order.items as OrderItem[])
    .map(
      (i) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;">${i.name}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;">${i.quantity}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;">₪${i.price}</td></tr>`
    )
    .join("");

  const html = `
    <div dir="rtl" style="font-family:sans-serif;">
      <h2>הזמנה חדשה — VITA / V-FORM</h2>
      <p><b>שם:</b> ${order.customer_name}</p>
      <p><b>אימייל:</b> ${order.customer_email}</p>
      <p><b>טלפון:</b> ${order.customer_phone ?? "-"}</p>
      <p><b>כתובת:</b> ${order.address}</p>
      <p><b>אזור משלוח:</b> ${order.shipping_region} (₪${order.shipping_cost})</p>
      ${order.notes ? `<p><b>הערות:</b> ${order.notes}</p>` : ""}
      <table style="border-collapse:collapse;margin-top:10px;">
        <thead><tr><th style="text-align:right;padding:6px 10px;">מוצר</th><th style="text-align:right;padding:6px 10px;">כמות</th><th style="text-align:right;padding:6px 10px;">מחיר</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="margin-top:14px;font-size:16px;"><b>סה"כ: ₪${order.total}</b></p>
    </div>
  `;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "VITA Orders <onboarding@resend.dev>",
      to: TO_EMAIL,
      subject: `הזמנה חדשה מ-${order.customer_name}`,
      html,
    });
    if (error) {
      console.error("send-order-email rejected by Resend:", error);
      return NextResponse.json({ error: error.message ?? "failed to send email" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-order-email failed", err);
    return NextResponse.json({ error: "failed to send email" }, { status: 500 });
  }
}
