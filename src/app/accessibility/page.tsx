import type { Metadata } from "next";
import { Accessibility, Keyboard, MonitorSmartphone, AlertTriangle, Mail, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: "הצהרת הנגישות של אתר V-FORM NUTRITION — התאמות שבוצעו, תקנים ורמת הנגישות, ופרטי יצירת קשר לדיווח על בעיות נגישות.",
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-navy-950 pt-32 pb-20 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center mx-auto mb-4">
            <Accessibility className="w-7 h-7 text-cyan" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">הצהרת נגישות</h1>
          <p className="text-white/50 text-sm">עודכן לאחרונה: 11 ביולי 2026</p>
        </div>

        <div className="space-y-4">
          <section className="bg-navy-900 border border-white/[0.08] rounded-2xl p-5">
            <h2 className="text-white font-bold mb-2">המחויבות שלנו לנגישות</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              V-FORM NUTRITION רואה חשיבות רבה במתן שירות שוויוני ונגיש לכלל לקוחותיה, לרבות אנשים עם מוגבלות.
              אנו פועלים באופן שוטף לשפר את נגישות האתר ולהנגיש את השירותים המוצעים בו לכלל הגולשים,
              מתוך אמונה כי לכל אדם מגיעה הזכות לגלוש, לקנות ולקבל מידע בנוחות ובעצמאות.
            </p>
          </section>

          <section className="bg-navy-900 border border-white/[0.08] rounded-2xl p-5">
            <h2 className="text-white font-bold mb-2">התקן ורמת הנגישות</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              האתר נבנה ותוחזק תוך שאיפה לעמידה בדרישות התקן הישראלי ת״י 5568 להנגשת תכנים באינטרנט,
              ברמת AA, המבוסס על הנחיות WCAG 2.2 (Web Content Accessibility Guidelines) הבינלאומיות.
            </p>
          </section>

          <section className="bg-navy-900 border border-white/[0.08] rounded-2xl p-5">
            <h2 className="text-white font-bold mb-2">התאמות הנגישות שבוצעו באתר</h2>
            <ul className="text-white/60 text-sm leading-relaxed list-disc pr-5 space-y-1.5">
              <li>מבנה סמנטי תקין (כותרות, ניווט, אזור תוכן ראשי ותחתית עמוד) התומך בקוראי מסך.</li>
              <li>קישור &quot;דילוג לתוכן הראשי&quot; בתחילת כל עמוד.</li>
              <li>תמיכה מלאה בניווט וניתוב באמצעות מקלדת בלבד, כולל בתפריטים, בעגלת הקניות ובתהליך הרכישה.</li>
              <li>מסגרת פוקוס (focus) ברורה ועקבית לכל הרכיבים האינטראקטיביים.</li>
              <li>שמות נגישים (aria-label) לכפתורים ולקישורים המכילים אייקונים בלבד.</li>
              <li>הכרזות קוליות (aria-live) בפעולות כמו הוספת מוצר לסל ועדכון כמות.</li>
              <li>ניהול פוקוס תקין בחלונות קופצים (למשל עגלת הקניות) — כולל מלכודת פוקוס, סגירה מקלדת Escape והחזרת פוקוס.</li>
              <li>טפסים עם תיוג (label) מקושר לכל שדה, סימון שדות חובה וסוגי autocomplete מתאימים.</li>
              <li>טקסט חלופי (alt) לתמונות משמעותיות, והסתרת אייקונים דקורטיביים מקוראי מסך.</li>
              <li>תמיכה בהגדרת מערכת ההפעלה prefers-reduced-motion להפחתת אנימציות.</li>
              <li>תפריט נגישות ייעודי המאפשר הגדלה/הקטנה של טקסט, ניגודיות גבוהה, מצב כהה, מצב שחור-לבן, הדגשת קישורים, ריווח שורות ואותיות, פונט קריא, עצירת אנימציות, הסתרת תמונות, סמן מוגדל ומסגרת פוקוס מודגשת — עם שמירת ההעדפה בין ביקורים.</li>
            </ul>
          </section>

          <section className="bg-navy-900 border border-white/[0.08] rounded-2xl p-5">
            <h2 className="text-white font-bold mb-2 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-cyan" aria-hidden="true" /> ניווט במקלדת
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              ניתן לנווט בכל האתר באמצעות מקש Tab (קדימה) ו-Shift+Tab (אחורה), להפעיל קישורים וכפתורים באמצעות Enter או Space,
              ולסגור חלונות וחלוניות פתוחות באמצעות מקש Escape.
            </p>
          </section>

          <section className="bg-navy-900 border border-white/[0.08] rounded-2xl p-5">
            <h2 className="text-white font-bold mb-2 flex items-center gap-2">
              <MonitorSmartphone className="w-4 h-4 text-cyan" aria-hidden="true" /> תאימות דפדפנים וטכנולוגיות מסייעות
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              האתר נבדק ומותאם לדפדפנים העדכניים המובילים — Chrome, Safari, Firefox ו-Edge — בתצוגת מחשב, טאבלט ומובייל,
              ותוכנן לעבוד בשילוב עם קוראי מסך נפוצים.
            </p>
          </section>

          <section className="bg-navy-900 border border-white/[0.08] rounded-2xl p-5">
            <h2 className="text-white font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-cyan" aria-hidden="true" /> מגבלות נגישות ידועות
            </h2>
            <ul className="text-white/60 text-sm leading-relaxed list-disc pr-5 space-y-1.5">
              <li>סרטון המותג בעמוד הבית מוצג ללא כתוביות מוטמעות. אם קיים בו מידע קולי מהותי, ניתן לפנות אלינו לקבלת תמליל.</li>
              <li>אזור הניהול הפנימי (Admin) מיועד לשימוש צוות בלבד ואינו עבר הנגשה מלאה ברמה זהה לאתר הציבורי.</li>
            </ul>
          </section>

          <section className="bg-navy-900 border border-white/[0.08] rounded-2xl p-5">
            <h2 className="text-white font-bold mb-2">דיווח על בעיית נגישות</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-3">
              אם נתקלת בבעיית נגישות באתר, או שיש לך הצעה לשיפור, נשמח שתפנה/י אלינו ונטפל בפנייתך בהקדם האפשרי.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="tel:+972553056222" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan text-navy-900 font-bold text-sm hover:bg-cyan-400 transition-colors">
                <Phone className="w-4 h-4" aria-hidden="true" /> 055-305-6222
              </a>
              <a href="mailto:vformnutrition@gmail.com" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/70 font-bold text-sm hover:border-cyan/30 hover:text-white transition-colors">
                <Mail className="w-4 h-4" aria-hidden="true" /> vformnutrition@gmail.com
              </a>
            </div>
            <p className="text-white/40 text-xs mt-4">
              {/* TODO: להשלים שם רכז/ת נגישות רשמי/ת, ככל שיוגדר עבור העסק */}
              רכז/ת נגישות: יעודכן בהמשך (TODO).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
