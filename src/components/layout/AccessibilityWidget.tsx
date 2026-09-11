"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Accessibility,
  X,
  Plus,
  Minus,
  RotateCcw,
  Sun,
  Moon,
  Contrast,
  Palette,
  Eclipse,
  Link2,
  Heading,
  AlignJustify,
  CaseSensitive,
  Type,
  PauseCircle,
  VideoOff,
  ImageOff,
  MousePointer2,
  Focus,
  ScanEye,
  Rows3,
} from "lucide-react";

const STORAGE_KEY = "vform_a11y_settings";

type ToggleKey =
  | "contrastHigh"
  | "contrastDark"
  | "grayscale"
  | "invertColors"
  | "underlineLinks"
  | "highlightHeadings"
  | "lineHeight"
  | "letterSpacing"
  | "readableFont"
  | "stopMotion"
  | "disableFlashing"
  | "hideImages"
  | "bigCursor"
  | "focusStrong"
  | "readingGuide"
  | "readingMask";

type Theme = "dark" | "light";

type Settings = {
  textScale: number;
  theme: Theme;
} & Record<ToggleKey, boolean>;

const DEFAULTS: Settings = {
  textScale: 1,
  theme: "dark",
  contrastHigh: false,
  contrastDark: false,
  grayscale: false,
  invertColors: false,
  underlineLinks: false,
  highlightHeadings: false,
  lineHeight: false,
  letterSpacing: false,
  readableFont: false,
  stopMotion: false,
  disableFlashing: false,
  hideImages: false,
  bigCursor: false,
  focusStrong: false,
  readingGuide: false,
  readingMask: false,
};

const CLASS_MAP: Partial<Record<ToggleKey, string>> = {
  contrastHigh: "a11y-contrast-high",
  underlineLinks: "a11y-underline-links",
  highlightHeadings: "a11y-highlight-headings",
  lineHeight: "a11y-line-height",
  letterSpacing: "a11y-letter-spacing",
  readableFont: "a11y-readable-font",
  stopMotion: "a11y-stop-motion",
  hideImages: "a11y-hide-images",
  bigCursor: "a11y-big-cursor",
  focusStrong: "a11y-focus-strong",
};

const TEXT_PRESETS = [1, 1.15, 1.3, 1.5];

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function computeFilter(s: Settings): string {
  const parts: string[] = [];
  if (s.grayscale) parts.push("grayscale(1)");
  if (s.contrastHigh) parts.push("contrast(1.35) saturate(1.15)");
  if (s.contrastDark) parts.push("brightness(0.82)");
  if (s.invertColors) parts.push("invert(1)");
  if (s.theme === "light") parts.push("invert(1) hue-rotate(180deg)");
  return parts.join(" ");
}

function applySettings(s: Settings) {
  const html = document.documentElement;
  html.style.setProperty("--a11y-text-scale", String(s.textScale));
  html.style.filter = computeFilter(s);
  (Object.keys(CLASS_MAP) as ToggleKey[]).forEach((key) => {
    const cls = CLASS_MAP[key];
    if (cls) html.classList.toggle(cls, !!s[key]);
  });

  const pauseMedia = s.stopMotion || s.disableFlashing;
  document.querySelectorAll<HTMLMediaElement>("video, audio").forEach((el) => {
    if (pauseMedia) {
      el.dataset.a11yWasPlaying = el.paused ? "" : "1";
      el.pause();
    } else if (el.dataset.a11yWasPlaying === "1") {
      el.play().catch(() => {});
      delete el.dataset.a11yWasPlaying;
    }
  });
}

const VISION_TOGGLES: { key: ToggleKey; label: string; icon: typeof Sun }[] = [
  { key: "contrastHigh", label: "ניגודיות גבוהה", icon: Contrast },
  { key: "contrastDark", label: "עמעום תצוגה", icon: Eclipse },
  { key: "grayscale", label: "מצב שחור-לבן", icon: Palette },
  { key: "invertColors", label: "היפוך צבעים", icon: Palette },
];

const CONTENT_TOGGLES: { key: ToggleKey; label: string; icon: typeof Sun }[] = [
  { key: "readableFont", label: "פונט ידידותי לדיסלקציה", icon: Type },
  { key: "lineHeight", label: "ריווח שורות מוגדל", icon: Rows3 },
  { key: "letterSpacing", label: "ריווח אותיות מוגדל", icon: CaseSensitive },
  { key: "underlineLinks", label: "הדגשת קישורים", icon: Link2 },
  { key: "highlightHeadings", label: "הדגשת כותרות", icon: Heading },
  { key: "hideImages", label: "הסתרת תמונות", icon: ImageOff },
];

const NAV_TOGGLES: { key: ToggleKey; label: string; icon: typeof Sun }[] = [
  { key: "stopMotion", label: "עצירת אנימציות", icon: PauseCircle },
  { key: "disableFlashing", label: "השבתת אלמנטים מהבהבים", icon: VideoOff },
  { key: "bigCursor", label: "סמן עכבר מוגדל", icon: MousePointer2 },
  { key: "focusStrong", label: "מסגרת פוקוס מודגשת", icon: Focus },
  { key: "readingGuide", label: "פס קריאה", icon: AlignJustify },
  { key: "readingMask", label: "מסכת קריאה", icon: ScanEye },
];

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [mounted, setMounted] = useState(false);
  const [guideY, setGuideY] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    applySettings(s);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applySettings(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* localStorage unavailable — settings still work for this session */
    }
  }, [settings, mounted]);

  // Reading guide / reading mask follow the pointer (mouse + touch)
  useEffect(() => {
    if (!settings.readingGuide && !settings.readingMask) {
      setGuideY(null);
      return;
    }
    const onMove = (e: MouseEvent) => setGuideY(e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) setGuideY(e.touches[0].clientY);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [settings.readingGuide, settings.readingMask]);

  // Focus trap + Escape-to-close + return focus to trigger
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        return;
      }
      if (e.key === "Tab" && focusables && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [open]);

  const update = (patch: Partial<Settings>) =>
    setSettings((s) => ({ ...s, ...patch }));

  const increaseText = () =>
    update({ textScale: Math.min(1.5, Math.round((settings.textScale + 0.1) * 10) / 10) });
  const decreaseText = () =>
    update({ textScale: Math.max(0.85, Math.round((settings.textScale - 0.1) * 10) / 10) });
  const resetText = () => update({ textScale: 1 });
  const resetAll = () => setSettings(DEFAULTS);
  const toggle = (key: ToggleKey) => update({ [key]: !settings[key] } as Partial<Settings>);
  const setTheme = (theme: Theme) =>
    update({ theme, ...(theme === "light" ? { invertColors: false } : {}) });

  return (
    <>
      {settings.readingMask && guideY !== null && (
        <>
          <div
            className="fixed inset-x-0 top-0 z-[9996] bg-black/70 pointer-events-none"
            style={{ height: Math.max(guideY - 70, 0) }}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-[9996] bg-black/70 pointer-events-none"
            style={{ top: guideY + 70 }}
          />
        </>
      )}
      {settings.readingGuide && guideY !== null && (
        <div
          className="fixed inset-x-0 z-[9997] h-0.5 bg-cyan shadow-[0_0_14px_rgba(0,212,255,0.85)] pointer-events-none"
          style={{ top: guideY }}
        />
      )}

      <motion.button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="accessibility-panel"
        aria-label="פתח תפריט נגישות"
        title="נגישות"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={{ boxShadow: open ? "0 0 0 0 rgba(0,212,255,0)" : ["0 0 0 0 rgba(0,212,255,0.35)", "0 0 0 10px rgba(0,212,255,0)"] }}
        transition={open ? { duration: 0.2 } : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-4 sm:left-6 z-[9997] w-11 h-11 rounded-full glass-cyan backdrop-blur-md border border-cyan/30 shadow-cyan flex items-center justify-center text-cyan hover:text-navy-900 hover:bg-cyan transition-colors"
      >
        <Accessibility className="w-5 h-5" aria-hidden="true" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              ref={panelRef}
              id="accessibility-panel"
              role="dialog"
              aria-modal="true"
              aria-label="תפריט נגישות"
              dir="rtl"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 sm:left-6 z-[9999] w-[92vw] max-w-sm max-h-[75vh] overflow-y-auto glass-cyan backdrop-blur-xl border border-cyan/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-lg flex items-center gap-2">
                  <Accessibility className="w-5 h-5 text-cyan" aria-hidden="true" />
                  נגישות
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="סגור תפריט נגישות"
                  className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:border-white/20 transition-all"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Text size */}
                <div>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">
                    גודל טקסט
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={decreaseText}
                      aria-label="הקטן טקסט"
                      className="flex-1 h-10 rounded-xl glass border border-white/10 hover:border-cyan/40 flex items-center justify-center transition-all active:scale-95"
                    >
                      <Minus className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={resetText}
                      aria-label="איפוס גודל טקסט"
                      className="flex-1 h-10 rounded-xl glass border border-white/10 hover:border-cyan/40 flex items-center justify-center text-xs font-bold transition-all active:scale-95"
                    >
                      {Math.round(settings.textScale * 100)}%
                    </button>
                    <button
                      type="button"
                      onClick={increaseText}
                      aria-label="הגדל טקסט"
                      className="flex-1 h-10 rounded-xl glass border border-white/10 hover:border-cyan/40 flex items-center justify-center transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {TEXT_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => update({ textScale: p })}
                        aria-pressed={settings.textScale === p}
                        className={`flex-1 h-8 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                          settings.textScale === p
                            ? "bg-cyan text-navy-900"
                            : "glass border border-white/10 text-white/60 hover:border-cyan/40"
                        }`}
                      >
                        {Math.round(p * 100)}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">
                    מצב תצוגה
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      aria-pressed={settings.theme === "dark"}
                      className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 ${
                        settings.theme === "dark"
                          ? "bg-cyan text-navy-900"
                          : "glass border border-white/10 text-white/70 hover:border-cyan/40"
                      }`}
                    >
                      <Moon className="w-4 h-4" aria-hidden="true" />
                      כהה
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      aria-pressed={settings.theme === "light"}
                      className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 ${
                        settings.theme === "light"
                          ? "bg-cyan text-navy-900"
                          : "glass border border-white/10 text-white/70 hover:border-cyan/40"
                      }`}
                    >
                      <Sun className="w-4 h-4" aria-hidden="true" />
                      בהיר
                    </button>
                  </div>
                </div>

                <ToggleGroup title="ראייה וניגודיות" items={VISION_TOGGLES} settings={settings} onToggle={toggle} />
                <ToggleGroup title="תוכן וקריאה" items={CONTENT_TOGGLES} settings={settings} onToggle={toggle} />
                <ToggleGroup title="ניווט ותנועה" items={NAV_TOGGLES} settings={settings} onToggle={toggle} />
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 space-y-2.5">
                <button
                  type="button"
                  onClick={resetAll}
                  className="w-full flex items-center justify-center gap-2 glass border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-bold py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  איפוס כל הגדרות הנגישות
                </button>
                <Link
                  href="/accessibility"
                  onClick={() => setOpen(false)}
                  className="block text-center text-cyan hover:underline text-sm font-semibold py-1"
                >
                  הצהרת נגישות
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function ToggleGroup({
  title,
  items,
  settings,
  onToggle,
}: {
  title: string;
  items: { key: ToggleKey; label: string; icon: typeof Sun }[];
  settings: Settings;
  onToggle: (key: ToggleKey) => void;
}) {
  return (
    <div>
      <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-3">
        {items.map(({ key, label, icon: Icon }) => (
          <ToggleRow
            key={key}
            label={label}
            icon={Icon}
            checked={settings[key]}
            onChange={() => onToggle(key)}
          />
        ))}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon: typeof Sun;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-white/80 flex items-center gap-2">
        <Icon className="w-4 h-4 text-white/40 flex-shrink-0" aria-hidden="true" />
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? "bg-cyan" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
            checked ? "right-1" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
