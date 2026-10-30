import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("product_view_counts")
    .select("product_id, view_count");
  if (error) return NextResponse.json({ error: "Could not load product views" }, { status: 503 });
  const views = Object.fromEntries((data ?? []).map(row => [row.product_id, Number(row.view_count)]));
  return NextResponse.json({ views }, { headers: { "Cache-Control": "no-store" } });
}
