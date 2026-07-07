import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAILS = ["2bnbussiness@gmail.com", "2bnmedia@gmail.com", "vformnutrition@gmail.com"];
const ADMIN_PASSWORD = "123456";
const SESSION_TOKEN = "vform_admin_session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!ADMIN_EMAILS.includes(email?.toLowerCase().trim()) || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "אימייל או סיסמה שגויים" }, { status: 401 });
  }

  const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_TOKEN, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_TOKEN);
  return res;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("vform_admin_session")?.value;
  if (!token) return NextResponse.json({ auth: false }, { status: 401 });
  return NextResponse.json({ auth: true });
}
