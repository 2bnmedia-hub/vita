import Link from "next/link";
import { Zap, Instagram, Phone, MapPin, Mail } from "lucide-react";

const footerLinks = {
  חנות: [
    { label: "כל המוצרים", href: "/shop" },
    { label: "קריאטין אבקה", href: "/shop?cat=powder" },
    { label: "טבליות לעיסה", href: "/shop?cat=chewable" },
    { label: "מבצעים", href: "/shop?sale=true" },
  ],
  מידע: [
    { label: "אודות VFORM", href: "/#about" },
    { label: "מדיניות אספקה", href: "/shipping" },
    { label: "מדיניות החזרות", href: "/returns" },
    { label: "צור קשר", href: "/contact" },
  ],
};

export function Footer() {
  return (
    <footer className="relative bg-navy-900 border-t border-white/[0.06] overflow-hidden">
      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan flex items-center justify-center">
                <Zap className="w-4 h-4 text-navy-900 fill-navy-900" />
              </div>
              <span className="font-black text-lg">
                <span className="text-cyan">VF</span>
                <span className="text-white">ORM</span>
              </span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              איכות, אמינות וביצועים. תוספי תזונה לספורטאים ומתאמנים ברחבי ישראל.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/vform_nutrition"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg glass-cyan flex items-center justify-center hover:border-cyan/40 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 text-cyan" />
              </a>
              <a
                href="tel:+972553056222"
                className="w-9 h-9 rounded-lg glass-cyan flex items-center justify-center hover:border-cyan/40 transition-all"
                aria-label="טלפון"
              >
                <Phone className="w-4 h-4 text-cyan" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-bold text-sm mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-white/50 hover:text-cyan text-sm transition-colors duration-200"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4">צור קשר</h3>
            <div className="space-y-3">
              <a
                href="tel:+972553056222"
                className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
              >
                <Phone className="w-4 h-4 text-cyan flex-shrink-0" />
                055-305-6222
              </a>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <MapPin className="w-4 h-4 text-cyan flex-shrink-0" />
                באר שבע, מבצע נחשון 60
              </div>
              <a
                href="mailto:vformnutrition@gmail.com"
                className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
              >
                <Mail className="w-4 h-4 text-cyan flex-shrink-0" />
                vformnutrition@gmail.com
              </a>
            </div>

            {/* Certifications */}
            <div className="mt-5 flex flex-wrap gap-2">
              {["GMP", "HACCP", "ISO"].map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded text-[10px] font-bold text-cyan/80 border border-cyan/20 bg-cyan/5"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs">
            © 2026 <a href="https://www.2bnmedia.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan transition-colors">2bnmedia.com</a> · כל הזכויות שמורות
          </p>
          <p className="text-white/20 text-xs">
            תוסף תזונה — יש לשמור במקום קריר ויבש · להרחיק מהישג ידם של ילדים
          </p>
        </div>
      </div>
    </footer>
  );
}
