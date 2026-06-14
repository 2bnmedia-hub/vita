"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/auth";
import { Zap, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) {
      setError("שגיאה: " + authError.message);
      setLoading(false);
      return;
    }
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan mx-auto flex items-center justify-center mb-4 shadow-cyan">
            <Zap className="w-7 h-7 text-navy-900 fill-navy-900" />
          </div>
          <h1 className="text-2xl font-black"><span className="text-cyan">VI</span>TA ADMIN</h1>
          <p className="text-white/40 text-sm mt-1">כניסה לממשק ניהול</p>
        </div>
        <form onSubmit={handleLogin} className="glass border border-white/[0.08] rounded-2xl p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl">{error}</div>}
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-1.5">אימייל</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-navy-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20"
              placeholder="admin@vita.co.il" />
          </div>
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-1.5">סיסמה</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-navy-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-cyan text-navy-900 font-black py-3 rounded-xl hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />נכנס...</> : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
