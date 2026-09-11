import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCcw, Clock, AlertCircle, Phone, CheckCircle } from "lucide-react";

export const metadata: Metadata = { title: "מדיניות החזרות" };

const items = [
  {
    icon: CheckCircle,
    title: "זכות החזרה — 14 יום",
    body: "ניתן להחזיר מוצר שלא נפתח תוך 14 יום מיום קבלתו בהתאם לחוק הגנת הצרכן.",
  },
  {
    icon: AlertCircle,
    title: "תנאי ההחזרה",
    body: "המוצר חייב להיות באריזתו המקורית, סגור ולא פתוח. לא ניתן להחזיר מוצרים שנפתחו מטעמי בריאות והיגיינה.",
  },
  {
    icon: Clock,
    title: "תהליך ההחזרה",
    body: "פנה אלינו בטלפון או בטופס צור קשר. נשלח אליך תווית משלוח חוזר חינמית. לאחר קבלת המוצר — זיכוי תוך 5–7 ימי עסקים.",
  },
  {
    icon: RefreshCcw,
    title: "מוצר פגום או שגוי",
    body: "קיבלת מוצר פגום או שגוי? נחליף אותו ללא עלות ונדאג לאיסוף מיידי על חשבוננו.",
  },
];

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-navy-950 pt-32 pb-20 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center mx-auto mb-4">
            <RefreshCcw className="w-7 h-7 text-cyan" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">מדיניות החזרות</h1>
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

        <div className="bg-cyan/5 border border-cyan/20 rounded-2xl p-5 mb-6">
          <p className="text-white/70 text-sm leading-relaxed">
            <span className="text-cyan font-bold">שים לב: </span>
            זיכוי כספי יינתן לאמצעי התשלום המקורי. במקרה של תשלום בכרטיס אשראי — הזיכוי יופיע בחשבון תוך 3–5 ימי עסקים נוספים בהתאם למדיניות הבנק.
          </p>
        </div>

        <div className="bg-navy-900 border border-white/[0.08] rounded-2xl p-5">
          <h2 className="text-white font-bold mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-cyan" aria-hidden="true" /> רוצה להחזיר מוצר?
          </h2>
          <p className="text-white/60 text-sm mb-3">צור איתנו קשר ונטפל בזה במהירות.</p>
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
