import Link from "next/link";
import { ArrowLeft, MapPin, Phone } from "lucide-react";

const aboutStats = [
  { label: "משקל אריזה", value: "500g" },
  { label: "מנות באריזה", value: "166" },
  { label: "קריאטין למנה", value: "3g" },
  { label: "גרסאות אבקה", value: "3" },
  { label: "טבליות לעיסה", value: "150" },
  { label: "קלוריות לטבלייה", value: "<2 קק\"ל" },
];

export function AboutSection() {
  return (
    <>
      {/* About */}
      <section id="about" className="py-24 bg-navy-950 relative overflow-hidden">
        <div className="orb w-80 h-80 bg-cyan/6 top-0 right-0" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Text */}
            <div>
              <span className="inline-block text-cyan text-xs font-bold uppercase tracking-widest mb-3">
                אודות המותג
              </span>
              <h2 className="text-4xl font-black tracking-tight mb-5">
                VFORM{" "}
                <span className="text-gradient">NUTRITION</span>
              </h2>
              <p className="text-white/55 leading-relaxed mb-4">
                מותג בתחום תוספי התזונה ותזונת הספורט, המיועד לספורטאים,
                מתאמנים, חובבי כושר ואנשים השומרים על אורח חיים פעיל ובריא.
              </p>
              <p className="text-white/55 leading-relaxed mb-6">
                אנו מאמינים שתוסף תזונה איכותי מתחיל בייצור מקצועי, בקרת
                איכות ותיעוד מסודר. לכן אנו פועלים אך ורק עם ספקים ויצרנים
                מנוסים ומוסמכים.
              </p>

              <p className="text-cyan/80 font-bold text-lg italic mb-6">
                איכות, אמינות וביצועים.
              </p>

              {/* Certs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {["GMP", "HACCP", "ISO"].map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 rounded-lg glass-cyan border border-cyan/25 text-cyan text-xs font-black tracking-wider"
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <MapPin className="w-4 h-4 text-cyan flex-shrink-0" />
                  באר שבע, מבצע נחשון 60
                </div>
                <a
                  href="tel:+972553056222"
                  className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
                >
                  <Phone className="w-4 h-4 text-cyan flex-shrink-0" />
                  055-305-6222
                </a>
              </div>
            </div>

            {/* Stats box */}
            <div className="glass border border-white/[0.08] rounded-2xl p-6 divide-y divide-white/[0.06]">
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest pb-4">
                נתוני מוצר
              </p>
              {aboutStats.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3.5"
                >
                  <span className="text-white/45 text-sm">{label}</span>
                  <span className="font-black text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-20 bg-navy-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 via-transparent to-blue-500/5" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan/20 to-transparent" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl font-black tracking-tight mb-4">
            מוכן להתחיל?
          </h2>
          <p className="text-white/50 text-lg mb-8 leading-relaxed">
            הצטרף לאלפי מתאמנים שכבר בחרו ב-VITA. משלוח מהיר לכל הארץ.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/shop"
              className="btn-primary inline-flex items-center gap-2 bg-cyan text-navy-900 font-black px-8 py-4 rounded-xl text-base hover:bg-cyan-600 transition-colors shadow-cyan"
            >
              לחנות
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 glass border border-white/10 hover:border-cyan/30 text-white/80 hover:text-white font-bold px-8 py-4 rounded-xl text-base transition-all"
            >
              צור קשר
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
