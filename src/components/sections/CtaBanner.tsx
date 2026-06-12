"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export function CtaBanner() {
  return (
    <section className="relative py-24 overflow-hidden bg-navy-900">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan/12 via-transparent to-blue-500/8" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan/50 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan/20 to-transparent" />
      <div className="orb w-[500px] h-[500px] bg-cyan/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-cyan text-xs font-bold uppercase tracking-widest mb-4">
            מוכן להתחיל?
          </p>
          <h2 className="text-5xl sm:text-6xl font-black tracking-tight mb-6">
            התחל את המסע
            <br />
            <span className="text-gradient">שלך היום</span>
          </h2>
          <p className="text-white/50 text-xl mb-10 leading-relaxed">
            הצטרף לאלפי מתאמנים שכבר בחרו ב-VITA.
            <br />
            משלוח מהיר לכל הארץ.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/shop"
              className="btn-primary inline-flex items-center gap-2 bg-cyan text-navy-900 font-black px-10 py-4 rounded-xl text-lg hover:bg-cyan-600 transition-colors shadow-cyan"
            >
              לחנות
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 glass border border-white/10 hover:border-cyan/30 text-white/80 hover:text-white font-bold px-10 py-4 rounded-xl text-lg transition-all"
            >
              צור קשר
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
