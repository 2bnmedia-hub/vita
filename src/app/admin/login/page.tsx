"use client";

import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { ADMIN_FIELD, ADMIN_LABEL } from "@/components/admin/ui";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "שגיאה בכניסה");
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  };

  return (
    <div className="min-h-[100dvh] flex items-start sm:items-center justify-center px-4 pt-16 pb-72 sm:py-12" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="mx-auto mb-5 inline-flex items-center justify-center bg-navy-900 rounded-xl px-5 py-3">
            <img src="/logo.png" alt="V-FORM NUTRITION" className="h-8 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">כניסה לממשק הניהול</h1>
          <p className="text-slate-600 text-base mt-1">הזינו את פרטי החשבון כדי להמשיך</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2.5 rounded-lg" role="alert">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="admin-email" className={ADMIN_LABEL}>אימייל</label>
            <input
              id="admin-email" dir="ltr"
              type="email" required value={email} autoComplete="email"
              onChange={e => setEmail(e.target.value)}
              className={ADMIN_FIELD + " text-left"}
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className={ADMIN_LABEL}>סיסמה</label>
            <div className="relative">
              <input
                id="admin-password" dir="ltr"
                type={showPw ? "text" : "password"} required value={password} autoComplete="current-password"
                onChange={e => setPassword(e.target.value)}
                className={ADMIN_FIELD + " text-left pl-12"}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? "הסתר סיסמה" : "הצג סיסמה"} aria-pressed={showPw} className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:text-teal-700 hover:bg-slate-100">{showPw ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}</button>
            </div>
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full h-11 bg-teal-700 text-white text-base font-semibold rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />נכנס...</> : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
