"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/auth";
import { Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState({ a: "", b: "" });
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      const q = new URLSearchParams(window.location.search);
      const tokenHash = q.get("token_hash");
      const code = q.get("code");
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (!error) window.history.replaceState(null, "", "/account/reset-password");
      } else if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      // Supabase-mailer links land with #access_token…; supabase-js picks that up itself.
      await new Promise(r => setTimeout(r, 300));
      const { data } = await supabase.auth.getSession();
      setEmail(data.session?.user.email ?? "");
      setReady(data.session ? "ok" : "invalid");
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.a.length < 6) { toast.error("הסיסמה חייבת להכיל לפחות 6 תווים"); return; }
    if (pw.a !== pw.b) { toast.error("הסיסמאות אינן תואמות"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw.a });
    setLoading(false);
    if (error) { toast.error("עדכון הסיסמה נכשל: " + error.message); return; }
    toast.success("הסיסמה עודכנה בהצלחה");
    router.push("/account");
  };

  const field = "w-full bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 focus:border-cyan/40 outline-none transition-all";

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black">בחירת סיסמה חדשה</h1>
        </div>
        <div className="glass border border-white/[0.08] rounded-2xl p-7 space-y-4">
          {ready === "checking" && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-cyan animate-spin" aria-label="בודק קישור" /></div>}
          {ready === "invalid" && (
            <div className="text-center space-y-4" role="alert">
              <p className="text-white/70 text-sm">הקישור לא תקין או שפג תוקפו.</p>
              <Link href="/account/forgot-password" className="text-cyan hover:underline font-bold text-sm">שלח קישור חדש</Link>
            </div>
          )}
          {ready === "ok" && (
            <form onSubmit={submit} className="space-y-4">
              {/* Shows whose account this link opens, so a link sent by someone else is noticed. */}
              <p className="text-white/60 text-sm text-center">איפוס סיסמה עבור <span dir="ltr" className="text-white font-bold">{email}</span></p>
              <div>
                <label htmlFor="new-password" className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-1.5">סיסמה חדשה</label>
                <div className="relative">
                  <input id="new-password" required type={show ? "text" : "password"} autoComplete="new-password" minLength={6} value={pw.a} onChange={e => setPw(p => ({ ...p, a: e.target.value }))} className={field + " pl-11"} />
                  <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? "הסתר סיסמה" : "הצג סיסמה"} aria-pressed={show} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1">
                    {show ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="new-password-2" className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-1.5">אימות סיסמה</label>
                <input id="new-password-2" required type={show ? "text" : "password"} autoComplete="new-password" minLength={6} value={pw.b} onChange={e => setPw(p => ({ ...p, b: e.target.value }))} className={field} />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-cyan text-navy-900 font-black py-3.5 rounded-xl hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />שומר...</> : "שמירת סיסמה"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
