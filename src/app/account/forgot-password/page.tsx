"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(j.error || "השליחה נכשלה"); return; }
      setSent(true);
    } catch { toast.error("השליחה נכשלה"); }
    finally { setLoading(false); }
  };

  const field = "w-full bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 focus:border-cyan/40 outline-none transition-all";

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black">שכחתי סיסמה</h1>
          <p className="text-white/40 mt-2">נשלח לך קישור לבחירת סיסמה חדשה</p>
        </div>
        <div className="glass border border-white/[0.08] rounded-2xl p-7 space-y-4">
          {sent ? (
            <p className="text-white/80 text-sm text-center leading-relaxed" role="status">אם האימייל רשום אצלנו, נשלח אליו קישור לאיפוס הסיסמה. בדוק גם בתיקיית הספאם.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div><label htmlFor="forgot-email" className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-1.5">אימייל</label><input id="forgot-email" required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={field} placeholder="you@gmail.com" /></div>
              <button type="submit" disabled={loading} className="w-full bg-cyan text-navy-900 font-black py-3.5 rounded-xl hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />שולח...</> : "שליחת קישור לאיפוס"}
              </button>
            </form>
          )}
          <p className="text-center text-white/40 text-sm"><Link href="/account/login" className="text-cyan hover:underline font-bold">חזרה לכניסה</Link></p>
        </div>
      </div>
    </div>
  );
}
