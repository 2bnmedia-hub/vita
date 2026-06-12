"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-navy-950">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="orb w-[700px] h-[700px] bg-cyan/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan/50 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Text */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-cyan border border-cyan/20"
            >
              <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
              <span className="text-cyan text-xs font-bold tracking-widest uppercase">
                VITA NUTRITION — ישראל
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <h1 className="text-6xl sm:text-7xl font-black leading-[1.0] tracking-tight">
                לעולם לא
                <br />
                <span className="text-gradient">מאוחר מדי</span>
                <br />
                להתחיל.
              </h1>
              <p className="mt-6 text-white/55 text-xl leading-relaxed max-w-lg">
                קריאטין מונוהידראט טהור לספורטאים ומתאמנים. הכלים שצריך כדי להגיע לרמה הבאה.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/shop"
                className="btn-primary inline-flex items-center gap-2 bg-cyan text-navy-900 font-black px-8 py-4 rounded-xl text-lg hover:bg-cyan-600 transition-colors shadow-cyan"
              >
                לחנות
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Link
                href="/#benefits"
                className="inline-flex items-center gap-2 glass border border-white/10 hover:border-cyan/30 text-white/80 hover:text-white font-bold px-8 py-4 rounded-xl text-lg transition-all"
              >
                היתרונות
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-6 pt-6 border-t border-white/[0.06]"
            >
              {[
                { value: "3g", label: "קריאטין למנה" },
                { value: "166", label: "מנות באריזה" },
                { value: "100%", label: "קריאטין טהור" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="font-black text-3xl text-cyan">{value}</div>
                  <div className="text-white/40 text-sm mt-1">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-md mx-auto">
              {/* Main card */}
              <div className="relative rounded-3xl overflow-hidden glass-cyan border border-cyan/20 shadow-cyan aspect-[4/5] flex items-center justify-center bg-gradient-to-br from-navy-800 to-navy-950">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-transparent" />
                <span className="text-[180px] animate-float">🏋️</span>
                {/* Scan line */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                  <div className="animate-scan w-full h-12 bg-gradient-to-b from-transparent via-cyan/10 to-transparent" />
                </div>
              </div>

              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 glass-cyan border border-cyan/30 rounded-2xl px-4 py-3 shadow-cyan-sm"
              >
                <p className="text-cyan text-xs font-black">✓ GMP מוסמך</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-4 -left-4 glass-cyan border border-cyan/30 rounded-2xl px-4 py-3 shadow-cyan-sm"
              >
                <p className="text-cyan text-xs font-black">3g / מנה יומית</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/2 -left-8 glass border border-white/[0.08] rounded-xl px-3 py-2"
              >
                <p className="text-white/60 text-xs font-bold">166 מנות</p>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-navy-950 to-transparent pointer-events-none" />
    </section>
  );
}
