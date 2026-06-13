"use client";

import { motion } from "framer-motion";

const benefits = [
  {
    id: "01",
    title: "שפר את הביצועים שלך",
    desc: "קריאטין מונוהידראט תורם לשיפור הביצועים הגופניים בפעילות עצימה וקצרת מועד. מבוסס על מחקר מדעי מוכח.",
    emoji: "⚡", image: "/benefit-1.png",
    color: "from-cyan/10 to-transparent",
    border: "border-cyan/20",
  },
  {
    id: "02",
    title: "השג את המטרות שלך היום",
    desc: "3 גרם קריאטין ביום — בין אם אבקה לשייק או טבליות לעיסה ללא מים. נוחות מקסימלית לשגרת האימון שלך.",
    emoji: "🎯", image: "/benefit-2.png",
    color: "from-blue-500/10 to-transparent",
    border: "border-blue-500/20",
  },
  {
    id: "03",
    title: "ייצור לפי תקנים בינלאומיים",
    desc: "כל מוצר מיוצר לפי תקני GMP, HACCP ו-ISO. שקיפות מלאה בחומרי גלם ובתהליך הייצור.",
    emoji: "🔬", image: "/benefit-3.png",
    color: "from-purple-500/10 to-transparent",
    border: "border-purple-500/20",
  },
  {
    id: "04",
    title: "חזק ועצמתי יותר",
    desc: "מיועד לספורטאים, מתאמנים וחובבי כושר. תוסף שמתאים לכל שגרת אימון — לפני, אחרי, או במהלך היום.",
    emoji: "💪", image: "/benefit-4.png",
    color: "from-green-500/10 to-transparent",
    border: "border-green-500/20",
  },
];

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-28 bg-navy-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-cyan text-xs font-bold uppercase tracking-widest mb-3"
          >
            היתרונות
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black tracking-tight"
          >
            האם אתה מוכן
            <br />
            <span className="text-gradient">להשתנות?</span>
          </motion.h2>
        </div>

        {/* Benefits grid — alternating layout like mb-fit */}
        <div className="space-y-8">
          {benefits.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-8 items-center`}
            >
              {/* Image / Visual */}
              <div className="w-full lg:w-1/2">
                <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${b.color} border ${b.border} h-72 flex items-center justify-center glass`}>
                  <div className="absolute inset-0 bg-grid opacity-30" />
                  <>{b.image ? <img src={b.image} alt={b.title} className="w-full h-full object-cover absolute inset-0 rounded-2xl" /> : <span className="text-[100px] relative z-10">{b.emoji}</span>}</>
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full glass-cyan border border-cyan/30 flex items-center justify-center">
                    <span className="text-cyan text-xs font-black">{b.id}</span>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="w-full lg:w-1/2 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-cyan border border-cyan/20">
                  <span className="text-cyan text-xs font-black">{b.id}</span>
                </div>
                <h3 className="text-3xl font-black tracking-tight">{b.title}</h3>
                <p className="text-white/55 text-lg leading-relaxed">{b.desc}</p>
                <div className="w-16 h-1 rounded-full bg-cyan/40" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
