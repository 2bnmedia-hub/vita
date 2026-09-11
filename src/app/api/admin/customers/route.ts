import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: custData }, { data: fallback }] = await Promise.all([
    supabaseAdmin.from("customers").select("*").order("created_at", { ascending: false }),
    supabaseAdmin
      .from("contact_submissions")
      .select("*")
      .ilike("message", "%הרשמה חדשה לאתר%")
      .order("created_at", { ascending: false }),
  ]);

  const fallbackCustomers = (fallback ?? []).map((f: any) => ({
    id: "fallback_" + f.id,
    full_name: f.name,
    email: f.email,
    phone: f.phone,
    status: "pending",
    created_at: f.created_at,
    _fallback: true,
  }));

  const existingEmails = new Set((custData ?? []).map((c: any) => c.email));
  const newFallbacks = fallbackCustomers.filter((f) => !existingEmails.has(f.email));

  return NextResponse.json({ customers: [...(custData ?? []), ...newFallbacks] });
}
