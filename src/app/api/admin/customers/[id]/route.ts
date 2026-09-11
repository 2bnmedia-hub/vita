import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { action } = await req.json();
  const { id } = params;

  if (action === "reject") {
    if (id.startsWith("fallback_")) {
      const numericId = id.replace("fallback_", "");
      const { error } = await supabaseAdmin.from("contact_submissions").delete().eq("id", numericId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    const { error } = await supabaseAdmin.from("customers").update({ status: "rejected" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "approve") {
    // Fallback signups don't have a real Supabase Auth user yet — the client
    // calls /api/admin/promote-fallback for those instead of this route.
    if (id.startsWith("fallback_")) {
      return NextResponse.json({ error: "Use /api/admin/promote-fallback for fallback signups" }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("customers")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
