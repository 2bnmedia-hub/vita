"use client";

import { useState, useEffect } from "react";
import { Cookie, X, ChevronDown, ChevronUp, Shield, BarChart2, Megaphone, Check } from "lucide-react";

const STORAGE_KEY = "vform_cookie_consent";

type ConsentState = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
};

function getStoredConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConsent(analytics: boolean, marketing: boolean) {
  const state: ConsentState = {
    essential: true,
    analytics,
    marketing,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

const categories = [
  {
    key: "essential" as const,
    icon: Shield,
    title: "עוגיות חיוניות",
    description: "נדרשות לתפקוד בסיסי של האתר — כניסה לחשבון, עגלת קניות וניהול הגלישה. לא ניתן לכבות.",
    alwaysOn: true,
  },
  {
    key: "analytics" as const,
    icon: BarChart2,
    title: "עוגיות ניתוח",
    description: "עוזרות לנו להבין כיצד מבקרים משתמשים באתר כדי לשפר את החוויה. המידע אנונימי לחלוטין.",
    alwaysOn: false,
  },
  {
    key: "marketing" as const,
    icon: Megaphone,
    title: "עוגיות שיווק",
    description: "מאפשרות הצגת מודעות רלוונטיות ומעקב אחר קמפיינים שיווקיים.",
    alwaysOn: false,
  },
];

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (all: boolean) => {
    saveConsent(all, all);
    setVisible(false);
  };

  const saveCustom = () => {
    saveConsent(analytics, marketing);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-0 inset-x-0 z-[9999] p-4 sm:p-6 animate-in slide-in-from-bottom duration-500"
    >
      <div className="max-w-3xl mx-auto bg-navy-900 border border-white/10 rounded-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Top cyan line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan to-transparent opacity-70" />

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-4 h-4 text-cyan" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">אנחנו משתמשים ב-Cookies</h2>
                <p className="text-white/50 text-xs mt-0.5">לשיפור חוויית הגלישה ובהתאם לחוק הגנת הפרטיות</p>
              </div>
            </div>
            <button
              onClick={() => accept(false)}
              className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors flex-shrink-0"
              aria-label="סגור"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-white/60 text-sm leading-relaxed mb-4">
            אנו משתמשים בעוגיות כדי לשפר את חוויית הגלישה, לנתח תנועה באתר ולספק תוכן מותאם אישית.
            ניתן לנהל את ההעדפות שלך בכל עת.
          </p>

          {/* Details toggle */}
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-1.5 text-cyan text-xs font-semibold mb-4 hover:opacity-80 transition-opacity"
          >
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showDetails ? "הסתר פרטים" : "הגדרות מתקדמות"}
          </button>

          {/* Categories */}
          {showDetails && (
            <div className="space-y-2.5 mb-4">
              {categories.map(({ key, icon: Icon, title, description, alwaysOn }) => {
                const checked = alwaysOn || (key === "analytics" ? analytics : marketing);
                return (
                  <div
                    key={key}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-cyan" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">{title}</p>
                      <p className="text-white/40 text-xs leading-relaxed mt-0.5">{description}</p>
                    </div>
                    {alwaysOn ? (
                      <span className="text-cyan/70 text-xs font-bold mt-1 flex-shrink-0">תמיד פעיל</span>
                    ) : (
                      <button
                        onClick={() => {
                          if (key === "analytics") setAnalytics((v) => !v);
                          else setMarketing((v) => !v);
                        }}
                        className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 mt-1 ${
                          checked ? "bg-cyan" : "bg-white/10"
                        }`}
                        aria-checked={checked}
                        role="switch"
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                            checked ? "right-1" : "left-1"
                          }`}
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => accept(true)}
              className="flex-1 bg-cyan text-navy-900 font-black py-2.5 px-5 rounded-xl hover:bg-cyan-400 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              אישור הכל
            </button>
            {showDetails ? (
              <button
                onClick={saveCustom}
                className="flex-1 glass border border-white/10 hover:border-cyan/30 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm"
              >
                שמור הגדרות
              </button>
            ) : (
              <button
                onClick={() => accept(false)}
                className="flex-1 glass border border-white/10 hover:border-white/20 text-white/70 font-bold py-2.5 px-5 rounded-xl transition-colors text-sm"
              >
                חיוניות בלבד
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
