"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Zap, Award } from "lucide-react";

const stats = [
  { value: "3g", label: "קריאטין למנה" },
  { value: "166", label: "מנות באריזה" },
  { value: "100%", label: "קריאטין טהור" },
  { value: "GMP", label: "מוסמך ומאושר" },
];

const badges = [
  { icon: ShieldCheck, text: "GMP · HACCP · ISO" },
  { icon: Zap, text: "3g קריאטין ביום" },
  { icon: Award, text: "ייצור מקצועי" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-navy-950">
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid opacity-100" />
      <div className="absolute inset-0">
        {/* Radial glow */}
        <div className="orb w-[600px] h-[600px] bg-cyan/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="orb w-[300px] h-[300px] bg-blue-500/8 top-20 right-20" />
        <div className="orb w-[200px] h-[200px] bg-cyan/6 bottom-20 left-10" />
      </div>

      {/* Animated top line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan/50 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left / Text */}
          <div className="space-y-8">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-cyan border border-cyan/20 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
              <span className="text-cyan text-xs font-bold tracking-widest uppercase">
                VITA — ישראל
              </span>
            </div>

            {/* Headline */}
            <div className="animate-fade-up">
              <h1 className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight">
                תזונת ספורט
                <br />
                <span className="text-gradient">לרמה אחרת</span>
              </h1>
              <p className="mt-5 text-white/55 text-lg leading-relaxed max-w-lg">
                קריאטין מונוהידראט טהור לספורטאים ומתאמנים. אבקה בשלושה טעמים
                וטבליות לעיסה — ייצור לפי תקני GMP, HACCP ו-ISO.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4 animate-fade-up delay-200">
              <Link
                href="/shop"
                className="btn-primary inline-flex items-center gap-2 bg-cyan text-navy-900 font-black px-7 py-3.5 rounded-xl text-base hover:bg-cyan-600 transition-colors shadow-cyan"
              >
                לחנות
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link
                href="/#about"
                className="inline-flex items-center gap-2 glass border border-white/10 hover:border-cyan/30 text-white/80 hover:text-white font-bold px-7 py-3.5 rounded-xl text-base transition-all"
              >
                עוד עלינו
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3 animate-fade-up delay-300">
              {badges.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-white/[0.07]"
                >
                  <Icon className="w-3.5 h-3.5 text-cyan flex-shrink-0" />
                  <span className="text-white/60 text-xs font-medium">{text}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/[0.06] animate-fade-up delay-400">
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="font-black text-2xl text-cyan leading-tight">{value}</div>
                  <div className="text-white/40 text-xs mt-1 leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right / Product showcase */}
          <div className="flex items-center justify-center relative animate-fade-up delay-300">
            {/* Background ring */}
            <div className="absolute w-80 h-80 rounded-full border border-cyan/10" />
            <div className="absolute w-96 h-96 rounded-full border border-cyan/5" />

            {/* Main product mockup */}
            <div className="relative z-10 animate-float">
              <div className="w-72 h-72 rounded-3xl glass-cyan border border-cyan/20 flex items-center justify-center shadow-cyan">
                <span className="text-[120px]">🏋️</span>
              </div>

              {/* Floating tags */}
              <div className="absolute -top-4 -right-6 glass-cyan border border-cyan/25 rounded-2xl px-4 py-2 shadow-cyan-sm">
                <p className="text-cyan text-xs font-black">3g / מנה</p>
              </div>
              <div className="absolute -bottom-4 -left-6 glass-cyan border border-cyan/25 rounded-2xl px-4 py-2 shadow-cyan-sm">
                <p className="text-cyan text-xs font-black">166 מנות</p>
              </div>
              <div className="absolute top-1/2 -right-8 glass border border-white/[0.08] rounded-xl px-3 py-1.5">
                <p className="text-white/70 text-xs font-bold">✓ GMP</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-navy-950 to-transparent pointer-events-none" />
    </section>
  );
}
