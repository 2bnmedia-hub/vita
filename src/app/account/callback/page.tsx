"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handle = async () => {
      // Exchange code for session (PKCE flow)
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // Wait a moment for session to settle
      await new Promise((r) => setTimeout(r, 500));

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/account/login");
        return;
      }

      // Check if customer record exists, create if not
      const userId = session.user.id;
      const { data: existing } = await supabase
        .from("customers")
        .select("id, status")
        .eq("id", userId)
        .maybeSingle();

      if (!existing) {
        await supabase.from("customers").insert({
          id: userId,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
          status: "active",
        });
      }

      const status = existing?.status;
      if (status === "pending") {
        router.replace("/account/pending");
      } else {
        router.replace("/account");
      }
    };

    handle();
  }, [router]);

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-cyan animate-spin mx-auto mb-3" />
        <p className="text-white/50 text-sm">מתחבר...</p>
      </div>
    </div>
  );
}
