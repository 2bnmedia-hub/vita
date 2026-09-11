import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthed } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
  }

  const { contactId, email, fullName, phone } = await req.json();

  if (!contactId || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Create the user in Supabase Auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });

  if (authError) {
    // If user already exists in auth, just find them
    if (!authError.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
    // User exists — fetch their id
    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing?.users?.find((u) => u.email === email);
    if (!found) {
      return NextResponse.json({ error: "User exists but could not be found" }, { status: 400 });
    }
    authData.user = found as any;
  }

  const userId = authData?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Failed to get user id" }, { status: 500 });
  }

  // Upsert into customers as approved
  const { error: custError } = await admin.from("customers").upsert({
    id: userId,
    email,
    full_name: fullName,
    phone,
    status: "approved",
    approved_at: new Date().toISOString(),
  });

  if (custError) {
    return NextResponse.json({ error: custError.message }, { status: 500 });
  }

  // Send password reset so the user can set their password
  await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${req.nextUrl.origin}/account/login` },
  });

  // Delete from contact_submissions
  const numericId = String(contactId).replace("fallback_", "");
  await admin.from("contact_submissions").delete().eq("id", numericId);

  return NextResponse.json({ ok: true, userId });
}
