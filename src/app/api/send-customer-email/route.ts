import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/adminAuth";
import { sendCustomerEmail } from "@/lib/email";

/** Admin panel "message the customer" button. Was open to anyone (arbitrary-recipient mail relay). */
export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const r = await sendCustomerEmail(body ?? {});
  if (r.ok) return NextResponse.json({ ok: true });
  return NextResponse.json({ error: r.error }, { status: r.error === "missing to/message" ? 400 : 502 });
}
