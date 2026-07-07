"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/auth";
import { Zap, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(form);
    if (error) { toast.error("אימייל או סיסמה שגויים"); setLoading(false); return; }
    const { data: customer } = await supabase.from("customers").select("status").eq("id", (await supabase.auth.getUser()).data.user?.id).single();
    if (customer?.status === "pending") { router.push("/account/pending"); return; }
    toast.success("ברוך הבא! 👋");
    router.push("/account");
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/account/callback",
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (error) { toast.error("שגיאה בחיבור עם Google: " + error.message); setLoading(false); }
  };

  const field = "w-full bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 focus:border-cyan/40 outline-none transition-all";

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black">כניסה לחשבון</h1>
          <p className="text-white/40 mt-2">ברוך הבא בחזרה</p>
        </div>
        <div className="glass border border-white/[0.08] rounded-2xl p-7 space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-1.5">אימייל</label><input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={field} placeholder="you@gmail.com" /></div>
            <div><label className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-1.5">סיסמה</label><input required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={field} placeholder="••••••••" /></div>
            <button type="submit" disabled={loading}
              className="w-full bg-cyan text-navy-900 font-black py-3.5 rounded-xl hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />נכנס...</> : "כניסה"}
            </button>
          </form>
          <p className="text-center text-white/40 text-sm">
            אין לך חשבון?{" "}
            <Link href="/account/register" className="text-cyan hover:underline font-bold">הירשם</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
