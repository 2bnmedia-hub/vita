import { supabase } from "@/lib/supabase";

export { supabase };

export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export async function getCurrentCustomer() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;
  const { data } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .single();
  return !!data;
}
