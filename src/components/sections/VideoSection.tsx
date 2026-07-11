"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

export function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  return (
    <section className="relative py-24 overflow-hidden bg-navy-950">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="orb w-[600px] h-[600px] bg-cyan/10 top-0 left-1/2 -translate-x-1/2" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan/20 to-transparent" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-cyan text-xs font-bold uppercase tracking-widest mb-4">תראו את זה בפעולה</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
            <span className="text-gradient">V-FORM</span> בתנועה
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
            איכות, ביצועים ותוצאות — הכירו את V-FORM NUTRITION מקרוב.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl glass-cyan border border-cyan/20 shadow-cyan p-2 sm:p-3"
        >
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-navy-900">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src="/v-form.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />

            <button
              onClick={toggleMute}
              className="absolute bottom-4 left-4 w-11 h-11 rounded-xl glass border border-white/10 hover:border-cyan/40 flex items-center justify-center transition-all"
              aria-label={muted ? "הפעל קול" : "השתק"}
              title={muted ? "הפעל קול" : "השתק"}
            >
              {muted ? (
                <VolumeX className="w-5 h-5 text-white/80" />
              ) : (
                <Volume2 className="w-5 h-5 text-cyan" />
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
