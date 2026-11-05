import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateContact } from "@/lib/contact";

export const dynamic = "force-dynamic";

// ponytail: per-instance in-memory limiter (same as /api/admin-auth); a Vercel WAF
// rate-limit rule on /api/contact is the hard cap if spam ever gets through.
const hits = new Map<string, { n: number; until: number }>();
const MAX = 5;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-real-ip") ?? "unknown";
  const now = Date.now();
  const rec = hits.get(ip);
  const cur = rec && rec.until > now ? rec : { n: 0, until: now + WINDOW_MS };
  cur.n += 1;
  hits.set(ip, cur);
  if (cur.n > MAX) return NextResponse.json({ error: "יותר מדי פניות. נסה שוב בעוד כמה דקות." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 }); }
  const r = validateContact(body);
  // Honeypot hit: answer like a success so bots don't adapt, store nothing.
  if (!r.ok && r.spam) return NextResponse.json({ ok: true });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });

  const { error } = await supabaseAdmin.from("contact_submissions").insert([r.value]);
  if (error) {
    console.error("[contact] insert failed:", error.code); // no PII in logs
    return NextResponse.json({ error: "השליחה נכשלה" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
