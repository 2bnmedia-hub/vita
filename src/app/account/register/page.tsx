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

    const isRateLimit = error?.message?.toLowerCase().includes("rate limit") ||
                        error?.message?.toLowerCase().includes("over_email");
    const isAlreadyExists = error?.message?.toLowerCase().includes("already");

    if (isAlreadyExists) {
      toast.error("האימייל הזה כבר רשום. נסה להיכנס במקום.");
      setLoading(false);
      return;
    }

    // Save to contact_submissions as fallback (works even with rate limit)
    await supabase.from("contact_submissions").insert({
      name: form.full_name,
      email: form.email,
      phone: form.phone,
      message: `הרשמה חדשה לאתר | סיסמה נשמרת אצל הלקוח`,
    });

    if (!error || isRateLimit) {
      // Also try saving to customers if we got a user
      if (data?.user) {
        await supabase.from("customers").insert({
          id: data.user.id,
          email: form.email,
          full_name: form.full_name,
          phone: form.phone,
          status: "pending",
        });
      }
      toast.success("נרשמת בהצלחה! פרטיך התקבלו.");
      router.push("/account/pending");
    } else {
      toast.error("שגיאה בהרשמה. אנא נסה שוב.");
    }
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
          <h1 className="text-3xl font-black">הצטרף ל-VFORM</h1>
          <p className="text-white/40 mt-2">צור חשבון ותתחיל להזמין</p>
        </div>

        <div className="glass border border-white/[0.08] rounded-2xl p-7 space-y-5">
          <form onSubmit={handleRegister} className="space-y-4">
            <div><label htmlFor="register-name" className={label}>שם מלא *</label><input id="register-name" required autoComplete="name" value={form.full_name} onChange={e => set("full_name", e.target.value)} className={field} placeholder="ישראל ישראלי" /></div>
            <div><label htmlFor="register-email" className={label}>אימייל *</label><input id="register-email" required type="email" autoComplete="email" value={form.email} onChange={e => set("email", e.target.value)} className={field} placeholder="you@gmail.com" /></div>
            <div><label htmlFor="register-phone" className={label}>טלפון</label><input id="register-phone" autoComplete="tel" value={form.phone} onChange={e => set("phone", e.target.value)} className={field} placeholder="05X-XXX-XXXX" /></div>
            <div>
              <label htmlFor="register-password" className={label}>סיסמה *</label>
              <div className="relative">
                <input id="register-password" required type={showPass ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={e => set("password", e.target.value)} className={field + " pl-11"} placeholder="לפחות 6 תווים" minLength={6} />
                <button type="button" onClick={() => setShowPass(v => !v)} aria-label={showPass ? "הסתר סיסמה" : "הצג סיסמה"} aria-pressed={showPass} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-cyan text-navy-900 font-black py-3.5 rounded-xl hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />נרשם...</> : "הירשם עכשיו"}
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
