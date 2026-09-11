import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const { to, customerName, message, orderId } = await req.json();

  if (!to || !message?.trim()) {
    return NextResponse.json({ error: "missing to/message" }, { status: 400 });
  }

  const html = `
    <div dir="rtl" style="font-family:sans-serif;background:#0B1929;padding:32px;">
      <div style="max-width:480px;margin:0 auto;background:#0F2238;border-radius:16px;padding:28px;border:1px solid rgba(0,212,255,0.15);">
        <h2 style="color:#fff;margin:0 0 4px;">V-FORM NUTRITION</h2>
        <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0 0 20px;">עדכון להזמנה שלך${orderId ? ` #${String(orderId).slice(0, 8)}` : ""}</p>
        <p style="color:#fff;font-size:15px;">שלום ${customerName ?? ""},</p>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</p>
        <p style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:24px;">תודה שבחרת ב-V-FORM NUTRITION</p>
      </div>
    </div>
  `;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "V-FORM NUTRITION <onboarding@resend.dev>",
      to,
      subject: "עדכון להזמנתך — V-FORM NUTRITION",
      html,
    });
    if (error) {
      console.error("send-customer-email rejected by Resend:", error);
      return NextResponse.json({ error: error.message ?? "failed to send email" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-customer-email failed", err);
    return NextResponse.json({ error: "failed to send email" }, { status: 500 });
  }
}
