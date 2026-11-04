import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { adminEmail } from "@/lib/adminAuth";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const MAX_BYTES = 4 * 1024 * 1024; // Vercel's function body cap is 4.5 MB

/** Admin-only product image upload. Server picks the file name and extension; SVG/HTML are refused. */
export async function POST(req: NextRequest) {
  const who = adminEmail(req);
  if (!who) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "סוג קובץ לא נתמך (JPG/PNG/WEBP/GIF/AVIF)" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "הקובץ גדול מ-4MB" }, { status: 413 });

  const path = `products/${Date.now()}-${randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from("product-images")
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) { console.error("[admin/upload]", error.message); return NextResponse.json({ error: "שגיאה בהעלאה" }, { status: 500 }); }

  console.info(`[admin/upload] ${who} ${path}`);
  const { data } = supabaseAdmin.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
