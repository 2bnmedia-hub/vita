"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/auth";
import { Zap, Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, phone: form.phone } }
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("customers").insert({
        id: data.user.id,
        email: form.email,
        full_name: form.full_name,
        phone: form.phone,
        status: "pending",
      });
    }
    toast.success("נרשמת בהצלחה! הפרטים שלך ממתינים לאישור.");
    router.push("/account/pending");
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/account/callback" }
    });
  };

  const field = "w-full bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 focus:border-cyan/40 focus:ring-2 focus:ring-cyan/10 outline-none transition-all";
  const label = "text-white/50 text-xs font-bold uppercase tracking-wider block mb-1.5";

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan flex items-center justify-center shadow-cyan">
              <Zap className="w-5 h-5 text-navy-900 fill-navy-900" />
            </div>
            <span className="font-black text-xl"><span className="text-cyan">V</span>FORM</span>
          </Link>
          <h1 className="text-3xl font-black">הצטרף ל-VITA</h1>
          <p className="text-white/40 mt-2">צור חשבון ותתחיל להזמין</p>
        </div>

        <div className="glass border border-white/[0.08] rounded-2xl p-7 space-y-5">
          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 glass border border-white/[0.12] hover:border-white/25 py-3 rounded-xl text-sm font-bold transition-all hover:bg-white/5">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            המשך עם Google
          </button>

          <div className="flex items-center gap-3"><div className="flex-1 h-px bg-white/[0.06]" /><span className="text-white/20 text-xs">או</span><div className="flex-1 h-px bg-white/[0.06]" /></div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div><label className={label}>שם מלא *</label><input required value={form.full_name} onChange={e => set("full_name", e.target.value)} className={field} placeholder="ישראל ישראלי" /></div>
            <div><label className={label}>אימייל *</label><input required type="email" value={form.email} onChange={e => set("email", e.target.value)} className={field} placeholder="you@gmail.com" /></div>
            <div><label className={label}>טלפון</label><input value={form.phone} onChange={e => set("phone", e.target.value)} className={field} placeholder="05X-XXX-XXXX" /></div>
            <div>
              <label className={label}>סיסמה *</label>
              <div className="relative">
                <input required type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} className={field + " pl-11"} placeholder="לפחות 6 תווים" minLength={6} />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-cyan text-navy-900 font-black py-3.5 rounded-xl hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />נרשם...</> : "הירשם עכשיו"}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm">
            כבר יש לך חשבון?{" "}
            <Link href="/account/login" className="text-cyan hover:underline font-bold">כניסה</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
