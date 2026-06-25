"use client";

import { motion } from "framer-motion";
import { Instagram } from "lucide-react";


export function InstagramSection() {
  return (
    <section className="py-20 bg-navy-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white mb-4"
          >
            Follow us on Instagram
          </motion.h2>
        </div>

        <div className="text-center">
          <a
            href="https://www.instagram.com/vform_nutrition"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 glass-cyan border border-cyan/25 text-cyan font-bold px-6 py-3 rounded-xl hover:bg-cyan/10 transition-all"
          >
            <Instagram className="w-4 h-4" />
            Follow on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
