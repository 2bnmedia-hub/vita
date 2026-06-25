import { ShieldCheck, Zap, FlaskConical, Truck } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "ביצועים מוכחים",
    desc: "3 גרם קריאטין ביום תורמים לשיפור הביצועים הגופניים בפעילות עצימה וקצרת מועד — מבוסס על מחקר מדעי.",
    color: "text-cyan",
    bg: "bg-cyan/10 border-cyan/20",
  },
  {
    icon: ShieldCheck,
    title: "תקני GMP / HACCP / ISO",
    desc: "פועלים אך ורק עם יצרנים וספקים בעלי ניסיון המוסמכים לתקנים בינלאומיים של ייצור ובטיחות מזון.",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
  },
  {
    icon: FlaskConical,
    title: "חומרי גלם מאומתים",
    desc: "קריאטין מונוהידראט טהור, ייצור מקצועי עם בקרת איכות מלאה לאורך כל שרשרת האספקה.",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
  },
  {
    icon: Truck,
    title: "נוחות מקסימלית",
    desc: "בחר אבקה לשייק או טבליות לעיסה ללא מים. הפורמט שמתאים לך — לא לנו.",
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/20",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-navy-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="orb w-96 h-96 bg-cyan/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block text-cyan text-xs font-bold uppercase tracking-widest mb-3">
            למה VFORM?
          </span>
          <h2 className="text-4xl font-black tracking-tight">
            פשוט. איכותי.{" "}
            <span className="text-gradient">עובד.</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="group relative p-6 rounded-2xl bg-navy-800/60 border border-white/[0.07] hover:border-white/[0.15] transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <div
                className={`w-11 h-11 rounded-xl border ${bg} flex items-center justify-center mb-4`}
              >
                <Icon className={`w-5 h-5 ${color}`} />
              </div>

              <h3 className="font-bold text-white text-base mb-2">{title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{desc}</p>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-cyan/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
