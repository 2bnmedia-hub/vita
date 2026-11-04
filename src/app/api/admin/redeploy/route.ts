import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/adminAuth";

/** Triggers the Vercel deploy hook. The hook URL is server-only (it used to ship in the browser bundle). */
export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hook = process.env.DEPLOY_HOOK_URL;
  if (!hook) return NextResponse.json({ ok: false, error: "DEPLOY_HOOK_URL not set" }, { status: 503 });
  const r = await fetch(hook, { method: "POST" }).catch(() => null);
  return NextResponse.json({ ok: !!r?.ok }, { status: r?.ok ? 200 : 502 });
}
