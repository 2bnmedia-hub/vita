"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "יוסי כ.",
    role: "מתאמן כושר",
    text: "התחלתי עם קריאטין VITA לפני 3 חודשים. ההבדל בכוח ובביצועים מדהים. מומלץ בחום לכל מי שרוצה להתקדם.",
    stars: 5,
    emoji: "👨‍💪",
  },
  {
    name: "מיכל ר.",
    role: "רצה מרתון",
    text: "ניסיתי הרבה תוספים, אבל VITA הוא פשוט אחרת. הטבליות לעיסה נוחות במיוחד — לוקחת אותן לפני כל אימון בלי ערבוב.",
    stars: 5,
    emoji: "🏃‍♀️",
  },
  {
    name: "דניאל מ.",
    role: "מאמן כושר אישי",
    text: "אני ממליץ לכל הלקוחות שלי על VITA. מוצר איכותי, שקוף, עם תקנים בינלאומיים. התוצאות מדברות בעד עצמן.",
    stars: 5,
    emoji: "🏋️",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-28 bg-navy-950 relative overflow-hidden">
      <div className="orb w-96 h-96 bg-cyan/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-cyan text-xs font-bold uppercase tracking-widest mb-3"
          >
            ביקורות
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black tracking-tight"
          >
            מה אומרים
            <span className="text-gradient"> הלקוחות?</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group relative p-7 rounded-3xl glass border border-white/[0.07] hover:border-cyan/25 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Quote mark */}
              <div className="text-cyan/20 text-7xl font-black leading-none mb-4 select-none">"</div>

              <p className="text-white/70 text-base leading-relaxed mb-6 -mt-6">
                {t.text}
              </p>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-cyan text-cyan" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                <div className="w-11 h-11 rounded-2xl glass-cyan border border-cyan/20 flex items-center justify-center text-xl">
                  {t.emoji}
                </div>
                <div>
                  <p className="font-bold text-white">{t.name}</p>
                  <p className="text-white/40 text-sm">{t.role}</p>
                </div>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-3xl bg-cyan/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
