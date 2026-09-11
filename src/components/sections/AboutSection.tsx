'use client';

import { motion } from 'framer-motion';
import { Factory, ShieldCheck, BadgeCheck, MapPin, Phone } from 'lucide-react';

export default function AboutSection() {
  return (
    <section id="about" className="relative py-24 bg-navy-950 overflow-hidden">
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
          <h2 className="text-4xl md:text-5xl font-black text-gradient mb-4">אודותינו / About Us</h2>
          <div className="w-20 h-1 bg-cyan mx-auto rounded-full" />
        </motion.div>

        {/* Hebrew content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="glass rounded-3xl p-8 md:p-12 mb-6"
          dir="rtl"
        >
          <h3 className="text-2xl md:text-3xl font-black text-cyan mb-6">V-FORM NUTRITION</h3>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            הייצור של מוצרי V-FORM NUTRITION מתבצע בליווי מקצועי של מהנדסי מזון וטכנולוגי מזון, בעלי ידע וניסיון בתחום תוספי התזונה ותזונת הספורט.
            אנו שמים דגש על פיתוח מוצרים איכותיים, אמינים ונוחים לשימוש יומיומי עבור מתאמנים, ספורטאים ואנשים המקפידים על אורח חיים פעיל ובריא.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            תהליך הייצור מתחיל בבחירה קפדנית של חומרי גלם מתאימים, תוך בדיקת התאמה לדרישות האיכות והבטיחות המקובלות בתחום.
            בכל שלב בתהליך מושם דגש על בקרת איכות, תיעוד מסודר ושמירה על סטנדרטים מקצועיים גבוהים.
            המוצרים מיוצרים במפעלים וספקים בעלי ניסיון, הפועלים בהתאם למערכות איכות ובטיחות מזון מקובלות.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            צוות מקצועי מלווה את תהליך הפיתוח, ההרכבה והייצור במטרה להבטיח מוצר יציב, איכותי ובטוח לשימוש.
            אנו מאמינים כי תוסף תזונה איכותי מתחיל בידע מקצועי, תכנון נכון ובקרה קפדנית לאורך כל הדרך.
            לכן, כל מוצר נבחן גם מבחינת הרכב, טעם, נוחות שימוש והתאמה לצרכי הלקוח הישראלי.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            V-FORM NUTRITION פועלת בשקיפות מול הלקוחות, תוך הקפדה על מידע ברור, אמין ומדויק על גבי המוצרים.
            המטרה שלנו היא להציע מוצרי תזונת ספורט איכותיים, מודרניים ומקצועיים, העומדים בדרישות הרגולציה הרלוונטיות בישראל.
          </p>
        </motion.div>

        {/* English content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="glass rounded-3xl p-8 md:p-12 mb-10"
          dir="ltr"
        >
          <h3 className="text-2xl md:text-3xl font-black text-cyan mb-6">V-FORM NUTRITION</h3>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            The production of V-FORM NUTRITION products is carried out under the professional supervision of food engineers and food technologists with knowledge and experience in the field of dietary supplements and sports nutrition.
            We focus on developing high-quality, reliable, and convenient products for daily use by athletes, fitness enthusiasts, and people who maintain an active and healthy lifestyle.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            The production process begins with a careful selection of suitable raw materials, while ensuring compliance with accepted quality and safety requirements.
            At every stage of the process, strong emphasis is placed on quality control, organized documentation, and maintaining high professional standards.
            Our products are manufactured by experienced factories and suppliers that operate according to recognized food quality and safety systems.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            A professional team supervises the development, formulation, and production process in order to ensure a stable, high-quality, and safe product.
            We believe that a quality dietary supplement starts with professional knowledge, proper planning, and strict control throughout the entire process.
            Therefore, each product is reviewed in terms of composition, taste, ease of use, and suitability for the needs of the Israeli customer.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            V-FORM NUTRITION operates with transparency toward its customers, while ensuring clear, reliable, and accurate product information.
            Our goal is to provide high-quality, modern, and professional sports nutrition products that comply with the relevant regulatory requirements in Israel.
          </p>
        </motion.div>

        {/* Standards cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { title: 'GMP', sub: 'תנאי ייצור נאותים', Icon: Factory },
            { title: 'HACCP', sub: 'ניהול סיכונים ובקרת בטיחות מזון', Icon: ShieldCheck },
            { title: 'ISO', sub: 'מערכות ניהול איכות ובטיחות בהתאם לתקנים בינלאומיים', Icon: BadgeCheck },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass-cyan rounded-2xl p-6 text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
                  <item.Icon className="w-7 h-7 text-cyan" strokeWidth={1.5} aria-hidden="true" />
                </div>
              </div>
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
            <div className="w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-7 h-7 text-cyan" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <p className="text-cyan font-bold text-lg">מיקום</p>
              <p className="text-gray-300">נהריה, הגעתון 12</p>
            </div>
          </div>
          <div className="glass rounded-2xl p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center flex-shrink-0">
              <Phone className="w-7 h-7 text-cyan" strokeWidth={1.5} aria-hidden="true" />
            </div>
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
