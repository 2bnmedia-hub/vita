'use client';

import { motion } from 'framer-motion';

export default function AboutSection() {
  return (
    <section id="about" className="relative py-24 bg-navy-950 overflow-hidden" dir="rtl">
      {/* Background grid */}
      <div className="bg-grid absolute inset-0 opacity-20" />
      <div className="orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-10" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gradient mb-4">אודותינו</h2>
          <div className="w-20 h-1 bg-cyan mx-auto rounded-full" />
        </motion.div>

        {/* Main content card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="glass rounded-3xl p-8 md:p-12 mb-10"
        >
          <h3 className="text-2xl md:text-3xl font-black text-cyan mb-6">V-FORM NUTRITION</h3>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            מותג בתחום תוספי התזונה ותזונת הספורט, המיועד לספורטאים, מתאמנים, חובבי כושר ואנשים השומרים על אורח חיים פעיל ובריא.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            המותג הוקם מתוך מטרה להציע מוצרים איכותיים, אמינים ונוחים לשימוש, תוך הקפדה על בחירת חומרי גלם מתאימים, שקיפות מול הלקוח ועמידה בדרישות הרגולציה הרלוונטיות בישראל.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            ב־VFORM NUTRITION אנו מאמינים שתוסף תזונה איכותי מתחיל בייצור מקצועי, בקרת איכות ותיעוד מסודר. לכן אנו פועלים מול יצרנים וספקים בעלי ניסיון בתחום תוספי התזונה, הפועלים בהתאם למערכות איכות ובטיחות מזון מקובלות.
          </p>
        </motion.div>

        {/* Standards cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { title: 'GMP', sub: 'תנאי ייצור נאותים', icon: '🏭' },
            { title: 'HACCP', sub: 'ניהול סיכונים ובקרת בטיחות מזון', icon: '🛡️' },
            { title: 'ISO', sub: 'מערכות ניהול איכות ובטיחות בהתאם לתקנים בינלאומיים', icon: '✅' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass-cyan rounded-2xl p-6 text-center"
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <h4 className="text-cyan text-2xl font-black mb-2">{item.title}</h4>
              <p className="text-gray-300 text-sm leading-relaxed">{item.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Products line */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-2xl p-8 mb-10 text-center"
        >
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            מגוון המוצרים של V-FORM NUTRITION מיועד להשתלב בשגרת האימונים והתזונה היומית, וכולל בין היתר:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['אבקות חלבון', 'קריאטין', 'חומצות אמינו', 'פרי-וורקאאוט', 'ויטמינים', 'מינרלים'].map((tag) => (
              <span key={tag} className="bg-cyan/10 border border-cyan/30 text-cyan px-4 py-2 rounded-full text-sm font-semibold">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="glass rounded-2xl p-6 flex items-center gap-4">
            <span className="text-3xl">📍</span>
            <div>
              <p className="text-cyan font-bold text-lg">מיקום</p>
              <p className="text-gray-300">באר שבע, מבצע נחשון 60</p>
            </div>
          </div>
          <div className="glass rounded-2xl p-6 flex items-center gap-4">
            <span className="text-3xl">📞</span>
            <div>
              <p className="text-cyan font-bold text-lg">טלפון</p>
              <p className="text-gray-300" dir="ltr">055-305-6222</p>
            </div>
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-gradient text-2xl md:text-3xl font-black">
            VFORM NUTRITION — איכות, אמינות וביצועים
          </p>
        </motion.div>

      </div>
    </section>
  );
}
