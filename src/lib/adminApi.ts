/**
 * Browser-side helpers for the admin panel. All writes go through
 * /api/admin/* (admin cookie + service role on the server), never the anon key.
 * Results mirror supabase-js's `{ data, error }` so call sites stay unchanged.
 */
type Result = { data: any; error: { message: string } | null };

async function call(url: string, init?: RequestInit): Promise<Result> {
  try {
    const res = await fetch(url, init);
    const json = await res.json().catch(() => ({}));
    return res.ok ? { data: json.data ?? null, error: null } : { data: null, error: { message: json.error ?? `HTTP ${res.status}` } };
  } catch (e) {
    return { data: null, error: { message: String(e) } };
  }
}

type Op =
  | { op: "insert"; values: object | object[] }
  | { op: "upsert"; values: object[]; onConflict?: "slug" }
  | { op: "update"; id: string | number; values: object }
  | { op: "delete"; id: string | number };

export function adminWrite(table: "products" | "categories" | "contact_submissions", op: Op): Promise<Result> {
  return call("/api/admin/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, ...op }),
  });
}

export function adminList(table: "contact_submissions"): Promise<Result> {
  return call(`/api/admin/data?table=${table}`);
}

/** Uploads one product image; returns its public URL or null. */
export async function adminUpload(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    return (await res.json()).url ?? null;
  } catch {
    return null;
  }
}

export async function adminRedeploy(): Promise<boolean> {
  try { return (await fetch("/api/admin/redeploy", { method: "POST" })).ok; } catch { return false; }
}
