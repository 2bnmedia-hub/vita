import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Clock, MapPin, Phone, CheckCircle } from "lucide-react";

export const metadata: Metadata = { title: "מדיניות אספקה" };

const items = [
  { icon: Truck, title: "משלוח חינם מעל ₪199", body: "הזמנות מעל ₪199 זכאיות למשלוח חינם לכל הארץ." },
  { icon: Clock, title: "זמן אספקה", body: "1–3 ימי עסקים לאחר אישור ההזמנה. הזמנות שבוצעו לפני 14:00 יישלחו באותו יום." },
  { icon: MapPin, title: "אזורי חלוקה", body: "משלוח לכל רחבי ישראל — כולל פריפריה. משלוח לנקודת חלוקה: ₪15 | משלוח עד הבית: ₪25." },
  { icon: CheckCircle, title: "מעקב הזמנה", body: "עם שיגור ההזמנה תקבל SMS עם מספר מעקב ישיר לחברת השילוח." },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-navy-950 pt-32 pb-20 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center mx-auto mb-4">
            <Truck className="w-7 h-7 text-cyan" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">מדיניות אספקה</h1>
          <p className="text-white/50 text-sm">עודכן לאחרונה: ינואר 2026</p>
        </div>

        <div className="space-y-4 mb-10">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-navy-900 border border-white/[0.08] rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-cyan" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-white font-bold mb-1">{title}</h2>
                <p className="text-white/60 text-sm leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-navy-900 border border-white/[0.08] rounded-2xl p-5">
          <h2 className="text-white font-bold mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-cyan" aria-hidden="true" /> שאלות נוספות?
          </h2>
          <p className="text-white/60 text-sm mb-3">צוות שירות הלקוחות שלנו זמין לכל שאלה.</p>
          <div className="flex flex-wrap gap-3">
            <a href="tel:+972553056222" className="px-4 py-2 rounded-xl bg-cyan text-navy-900 font-bold text-sm hover:bg-cyan-400 transition-colors">
              055-305-6222
            </a>
            <Link href="/contact" className="px-4 py-2 rounded-xl border border-white/10 text-white/70 font-bold text-sm hover:border-cyan/30 hover:text-white transition-colors">
              טופס צור קשר
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
