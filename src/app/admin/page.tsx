import { createClient } from "@supabase/supabase-js";
import { Package, ShoppingBag, MessageSquare, Tag, TrendingUp } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getStats() {
  const [products, orders, contacts, categories] = await Promise.all([
    supabase.from("products").select("id", { count: "exact" }),
    supabase.from("orders").select("id,total,status", { count: "exact" }),
    supabase.from("contact_submissions").select("id", { count: "exact" }),
    supabase.from("categories").select("id", { count: "exact" }),
  ]);
  const totalRevenue = orders.data?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
  const pendingOrders = orders.data?.filter(o => o.status === "pending").length ?? 0;
  return {
    products: products.count ?? 0,
    orders: orders.count ?? 0,
    contacts: contacts.count ?? 0,
    categories: categories.count ?? 0,
    totalRevenue,
    pendingOrders,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "מוצרים", value: stats.products, icon: Package, color: "text-cyan", bg: "bg-cyan/10 border-cyan/20", href: "/admin/products" },
    { label: "הזמנות", value: stats.orders, icon: ShoppingBag, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", href: "/admin/orders" },
    { label: "פניות", value: stats.contacts, icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", href: "/admin/contacts" },
    { label: "קטגוריות", value: stats.categories, icon: Tag, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20", href: "/admin/categories" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">שלום, VITA 👋</h1>
        <p className="text-white/40 text-sm mt-1">סקירה כללית של החנות</p>
      </div>

      {/* Revenue banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-cyan/15 to-blue-500/10 border border-cyan/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-sm mb-1">סה"כ הכנסות</p>
            <p className="text-4xl font-black text-white">₪{stats.totalRevenue.toLocaleString("he-IL")}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-cyan/20 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-cyan" />
          </div>
        </div>
        {stats.pendingOrders > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold">
            ⚠️ {stats.pendingOrders} הזמנות ממתינות לטיפול
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <a key={label} href={href} className="group p-5 rounded-2xl glass border border-white/[0.07] hover:border-white/[0.15] transition-all hover:-translate-y-1">
            <div className={`w-10 h-10 rounded-xl border ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-white/40 text-sm mt-0.5">{label}</p>
          </a>
        ))}
      </div>

      {/* Quick links */}
      <div className="glass border border-white/[0.07] rounded-2xl p-5">
        <h2 className="font-bold text-white/60 text-sm uppercase tracking-wider mb-4">פעולות מהירות</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/products/new" className="btn-primary bg-cyan text-navy-900 font-bold px-4 py-2 rounded-xl text-sm hover:bg-cyan-600 transition-colors">
            + הוסף מוצר
          </a>
          <a href="/admin/categories" className="glass border border-white/[0.08] text-white/70 hover:text-white font-medium px-4 py-2 rounded-xl text-sm transition-all">
            + הוסף קטגוריה
          </a>
          <a href="/admin/orders" className="glass border border-white/[0.08] text-white/70 hover:text-white font-medium px-4 py-2 rounded-xl text-sm transition-all">
            צפה בהזמנות
          </a>
        </div>
      </div>
    </div>
  );
}
