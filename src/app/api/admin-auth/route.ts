import { NextRequest, NextResponse } from "next/server";
import { ADMIN_EMAILS, createAdminSessionToken, isAdminAuthed, verifyAdminPassword } from "@/lib/adminAuth";

const SESSION_TOKEN = "vform_admin_session";

// ponytail: per-instance in-memory limiter; resets on cold start and isn't shared
// across instances. A Vercel WAF rate-limit rule on /api/admin-auth is the hard cap.
const attempts = new Map<string, { n: number; until: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const MAX_ACCOUNT_ATTEMPTS = 20; // per admin email, across all IPs (stops IP rotation)

/** Vercel sets x-real-ip itself and overwrites any client-sent value; x-forwarded-for is not trusted. */
function clientIp(req: NextRequest): string {
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Counts one attempt for `key` synchronously (no await between read and write); true = over the limit. */
function hit(key: string, max: number, now: number): boolean {
  const rec = attempts.get(key);
  const cur = rec && rec.until > now ? rec : { n: 0, until: now + WINDOW_MS };
  cur.n += 1;
  attempts.set(key, cur);
  return cur.n > max;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (hit(`ip:${ip}`, MAX_ATTEMPTS, Date.now())) {
    return NextResponse.json({ error: "יותר מדי ניסיונות. נסה שוב בעוד 15 דקות." }, { status: 429 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 }); }
  const normalizedEmail = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
  if (ADMIN_EMAILS.includes(normalizedEmail) && hit(`acct:${normalizedEmail}`, MAX_ACCOUNT_ATTEMPTS, Date.now())) {
    return NextResponse.json({ error: "יותר מדי ניסיונות. נסה שוב בעוד 15 דקות." }, { status: 429 });
  }

  if (!ADMIN_EMAILS.includes(normalizedEmail) || !verifyAdminPassword(body?.password)) {
    console.warn(`[admin-auth] failed login ip=${ip}`);
    return NextResponse.json({ error: "אימייל או סיסמה שגויים" }, { status: 401 });
  }

  attempts.delete(`ip:${ip}`);
  attempts.delete(`acct:${normalizedEmail}`);
  console.info(`[admin-auth] login ok email=${normalizedEmail} ip=${ip}`);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_TOKEN, createAdminSessionToken(normalizedEmail), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
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
  if (!isAdminAuthed(req)) return NextResponse.json({ auth: false }, { status: 401 });
  return NextResponse.json({ auth: true });
}
