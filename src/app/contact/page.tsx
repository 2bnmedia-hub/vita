import type { Metadata } from "next";
import { ContactForm } from "@/components/sections/ContactForm";
import { MapPin, Phone, Mail, Instagram, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "צור קשר",
  description: "צור קשר עם VFORM NUTRITION — ענו לכל שאלה.",
};

const contacts = [
  { icon: Phone, label: "טלפון", value: "055-305-6222", href: "tel:+972553056222" },
  { icon: Mail, label: "אימייל", value: "info@vformnutrition.co.il", href: "mailto:info@vformnutrition.co.il" },
  { icon: MapPin, label: "כתובת", value: "באר שבע, מבצע נחשון 60", href: undefined },
  { icon: Instagram, label: "Instagram", value: "@vform_nutrition", href: "https://www.instagram.com/vform_nutrition" },
  { icon: Clock, label: "שעות פעילות", value: "א׳–ה׳ 09:00–18:00", href: undefined },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-navy-950 pt-24">
      {/* Hero */}
      <div className="relative bg-navy-900 border-b border-white/[0.06] py-14 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="orb w-64 h-64 bg-cyan/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block text-cyan text-xs font-bold uppercase tracking-widest mb-2">
            צור קשר
          </span>
          <h1 className="text-4xl font-black tracking-tight">איך נוכל לעזור?</h1>
          <p className="mt-3 text-white/50 max-w-md mx-auto">
            שאלות על מוצרים, הזמנות, או סתם רוצה לדעת יותר? אנחנו כאן.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Info */}
          <div className="lg:col-span-2 space-y-4">
            {contacts.map(({ icon: Icon, label, value, href }) => (
              <div
                key={label}
                className="flex gap-4 p-4 glass border border-white/[0.07] rounded-xl hover:border-cyan/25 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl glass-cyan border border-cyan/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-cyan" />
                </div>
                <div>
                  <p className="text-white/30 text-xs font-bold uppercase tracking-wider">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="text-white/80 hover:text-cyan text-sm font-medium transition-colors"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-white/80 text-sm font-medium">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
