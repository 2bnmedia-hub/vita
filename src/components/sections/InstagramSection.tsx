"use client";

import { motion } from "framer-motion";
import { Instagram } from "lucide-react";

const emojiList = ["A", "B", "C", "D", "E", "F"];

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

        <div className="flex justify-center gap-4 mb-10 flex-wrap">
          {emojiList.map((emoji, index) => (
            <motion.a
              key={index}
              href="https://www.instagram.com/vform_nutrition"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="w-16 h-16 flex items-center justify-center text-2xl rounded-xl glass-cyan border border-cyan/25 group hover:scale-105 transition-transform"
            >
              <span className="group-hover:scale-110 transition-transform duration-300">
                {emoji}
              </span>
            </motion.a>
          ))}
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
