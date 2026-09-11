import { NextRequest, NextResponse } from "next/server";
import { ADMIN_EMAILS, createAdminSessionToken } from "@/lib/adminAuth";

const ADMIN_PASSWORD = "v12348765v";
const SESSION_TOKEN = "vform_admin_session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const normalizedEmail = email?.toLowerCase().trim();

  if (!ADMIN_EMAILS.includes(normalizedEmail) || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "אימייל או סיסמה שגויים" }, { status: 401 });
  }

  const token = createAdminSessionToken(normalizedEmail);

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
