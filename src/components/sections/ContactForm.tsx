"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call — wire to /api/contact or Supabase later
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    toast.success("ההודעה נשלחה בהצלחה! נחזור אליך בהקדם.");
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  const field =
    "w-full bg-navy-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:border-cyan/40 focus:outline-none focus:ring-2 focus:ring-cyan/10 transition-all";

  return (
    <form
      onSubmit={handleSubmit}
      className="glass border border-white/[0.08] rounded-2xl p-7 space-y-5"
    >
      <h2 className="font-black text-xl mb-1">שלח הודעה</h2>
      <p className="text-white/40 text-sm mb-5">
        נשתדל לחזור תוך 24 שעות בימי עבודה.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-white/60 text-xs font-bold uppercase tracking-wider">
            שם מלא *
          </label>
          <input
            type="text"
            required
            placeholder="ישראל ישראלי"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={field}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-white/60 text-xs font-bold uppercase tracking-wider">
            אימייל *
          </label>
          <input
            type="email"
            required
            placeholder="israel@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={field}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-white/60 text-xs font-bold uppercase tracking-wider">
          טלפון (אופציונלי)
        </label>
        <input
          type="tel"
          placeholder="05X-XXX-XXXX"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className={field}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-white/60 text-xs font-bold uppercase tracking-wider">
          הודעה *
        </label>
        <textarea
          required
          rows={5}
          placeholder="שאלתך / פנייתך..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`${field} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 bg-cyan text-navy-900 font-black py-3.5 rounded-xl text-base hover:bg-cyan-600 transition-colors shadow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            שולח...
          </>
        ) : (
          <>
            שלח הודעה
            <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
