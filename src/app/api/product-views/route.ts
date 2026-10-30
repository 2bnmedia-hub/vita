import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createHash, randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const productId = request.headers.get("x-product-id") ?? "";
  const visitorCookie = request.cookies.get("vita_visitor")?.value;
  const visitorId = visitorCookie && /^[0-9a-f-]{36}$/i.test(visitorCookie)
    ? visitorCookie
    : randomUUID();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.rpc("record_product_view", {
    p_product_id: productId,
    p_visitor_id: createHash("sha256").update(visitorId).digest("hex"),
  });
  if (error) return NextResponse.json({ error: "Could not record view" }, { status: 503 });

  const response = NextResponse.json({ ok: true });
  if (!visitorCookie) {
    response.cookies.set("vita_visitor", visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
