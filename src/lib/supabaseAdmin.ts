import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server contexts only (admin API routes,
 * server components, webhooks). Bypasses RLS — never import this into
 * anything that runs in or is bundled for the browser.
 *
 * Lazily constructed behind a Proxy: Next's build-time "collect page data"
 * step imports every route module just to inspect its exports, which would
 * otherwise crash locally (SUPABASE_SERVICE_ROLE_KEY is only set in Vercel,
 * not .env.local) even though the route is never actually invoked at build time.
 */
let client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
