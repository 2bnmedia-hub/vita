import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// ponytail: per-instance in-memory limiter (same as /api/contact); WAF rule is the hard cap.
const hits = new Map<string, { n: number; until: number }>();
const MAX = 5;
const WINDOW_MS = 15 * 60 * 1000;
const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

// Same answer whether or not the account exists, so the form can't be used to probe emails.
const DONE = NextResponse.json({ ok: true });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-real-ip") ?? "unknown";
  const now = Date.now();
  const rec = hits.get(ip);
  const cur = rec && rec.until > now ? rec : { n: 0, until: now + WINDOW_MS };
  cur.n += 1;
  hits.set(ip, cur);
  if (cur.n > MAX) return NextResponse.json({ error: "יותר מדי בקשות. נסה שוב בעוד כמה דקות." }, { status: 429 });

  let email = "";
  try { email = String((await req.json())?.email ?? "").trim().toLowerCase(); } catch { /* fallthrough */ }
  if (!EMAIL_RE.test(email) || email.length > 254) return NextResponse.json({ error: "אימייל לא תקין" }, { status: 400 });

  const origin = req.nextUrl.origin;

  // Primary: our own link carrying the token hash. Doesn't depend on Supabase's
  // redirect allow-list; verifying it also confirms an unconfirmed email.
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email });
  if (error || !data?.properties?.hashed_token) return DONE; // unknown user: say nothing
  const link = `${origin}/account/reset-password?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery`;
  const sent = await sendPasswordResetEmail(email, link);
  if (sent.ok) return DONE;

  // Fallback: Supabase's own mailer (Resend sandbox only delivers to its account owner).
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: e2 } = await anon.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/account/reset-password` });
  if (e2) console.error("[forgot-password] both senders failed:", e2.status); // no PII in logs
  return DONE;
}
