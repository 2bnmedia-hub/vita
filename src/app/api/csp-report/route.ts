import { NextRequest, NextResponse } from "next/server";

// Receives CSP Report-Only violations. Logs directive + blocked origin only (no full URLs/PII).
export async function POST(req: NextRequest) {
  const text = (await req.text().catch(() => "")).slice(0, 8000);
  try {
    const r = JSON.parse(text)?.["csp-report"] ?? {};
    let blocked = String(r["blocked-uri"] ?? "");
    try { blocked = new URL(blocked).origin; } catch { /* 'inline', 'eval', etc. */ }
    console.warn(`[csp-report] ${r["violated-directive"] ?? r["effective-directive"] ?? "?"} blocked=${blocked.slice(0, 100)}`);
  } catch { /* malformed report: ignore */ }
  return new NextResponse(null, { status: 204 });
}
