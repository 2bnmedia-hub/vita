import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { adminEmail } from "@/lib/adminAuth";

/**
 * Admin-panel writes (products / categories / contact messages). These used to
 * run in the browser with the public anon key, which only worked because the
 * DB let *anyone* with that key edit prices and read contact messages. They
 * now go through here: admin cookie checked, service-role client, and an
 * explicit allowlist of table + operation.
 */
const ALLOWED: Record<string, string[]> = {
  products: ["insert", "update", "upsert", "delete"],
  categories: ["insert", "update", "delete"],
  contact_submissions: ["select", "update"],
};

const deny = (msg: string, status: number) => NextResponse.json({ error: msg }, { status });

export async function GET(req: NextRequest) {
  const who = adminEmail(req);
  if (!who) return deny("Unauthorized", 401);
  const table = req.nextUrl.searchParams.get("table") ?? "";
  if (!ALLOWED[table]?.includes("select")) return deny("Forbidden", 403);

  const { data, error } = await supabaseAdmin.from(table).select("*").order("created_at", { ascending: false });
  if (error) { console.error(`[admin/data] select ${table}:`, error.message); return deny("שגיאה בטעינה", 500); }
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const who = adminEmail(req);
  if (!who) return deny("Unauthorized", 401);

  let body: any;
  try { body = await req.json(); } catch { return deny("בקשה לא תקינה", 400); }
  const { table, op, values, id, onConflict } = body ?? {};
  if (typeof table !== "string" || !ALLOWED[table]?.includes(op) || op === "select") return deny("Forbidden", 403);
  if ((op === "update" || op === "delete") && (typeof id !== "string" && typeof id !== "number")) return deny("missing id", 400);
  if (op !== "delete" && (values == null || typeof values !== "object")) return deny("missing values", 400);

  const q = supabaseAdmin.from(table);
  const { data, error } =
    op === "insert" ? await q.insert(values).select()
    : op === "upsert" ? await q.upsert(values, { onConflict: onConflict === "slug" ? "slug" : undefined }).select("id")
    : op === "update" ? await q.update(values).eq("id", id).select()
    : await q.delete().eq("id", id);

  console.info(`[admin/data] ${who} ${op} ${table}${id != null ? ` id=${id}` : ""} ${error ? "FAILED" : "ok"}`);
  if (error) return deny(error.message, 400);
  return NextResponse.json({ data });
}
