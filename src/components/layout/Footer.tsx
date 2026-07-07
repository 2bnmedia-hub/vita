import Link from "next/link";
import { Zap, Instagram, Phone, MapPin, Mail } from "lucide-react";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

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
    <footer className="relative bg-navy-900 overflow-hidden">
      {/* Top bar */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan to-transparent opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <img src="/logo.png" alt="V-FORM NUTRITION" className="h-10 w-auto object-contain mix-blend-screen" />
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
              <a
                href="https://wa.me/972553056222"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg glass-cyan flex items-center justify-center hover:border-cyan/40 transition-all text-cyan"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon />
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
                נהריה, הגעתון 12
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
      {/* Bottom bar */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan to-transparent opacity-60" />
    </footer>
  );
}
