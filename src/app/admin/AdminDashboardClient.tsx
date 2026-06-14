"use client";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Package, ShoppingBag, MessageSquare, Users, TrendingUp, Clock, CheckCircle, Plus, Edit, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const statusLabel: Record<string, { label: string; color: string }> = {
  pending:   { label: "ממתין",  color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  confirmed: { label: "אושר",   color: "text-cyan bg-cyan/10 border-cyan/20" },
  shipped:   { label: "נשלח",   color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  delivered: { label: "נמסר",   color: "text-green-400 bg-green-400/10 border-green-400/20" },
  cancelled: { label: "בוטל",   color: "text-red-400 bg-red-400/10 border-red-400/20" },
};

type Order = { id: string; total: number; status: string; created_at: string; customer_name: string; items: any[] };
type Contact = { id: string; name: string; email: string; message: string; created_at: string; read: boolean };
type Product = { id: string; name: string; price: number; in_stock: boolean };
type Category = { id: string; name: string; slug: string; created_at: string };
type TopProduct = { name: string; count: number };

type Stats = {
  totalCustomers: number;
  newCustomersMonth: number;
  todayOrders: Order[];
  todayRevenue: number;
  monthOrders: number;
  monthRevenue: number;
  topProducts: TopProduct[];
  categories: Category[];
  products: Product[];
  pendingOrders: Order[];
  unreadContacts: Contact[];
  chartData: { month: string; revenue: number }[];
};

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-navy-800 border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-white/40 text-xs font-bold truncate">{label}</span>
      </div>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      {sub && <p className="text-xs font-bold" style={{color: "#00D4FF"}}>{sub}</p>}
    </div>
  );
}

function Section({ id, title, count, color, open, onToggle, children }: any) {
  return (
    <div className="bg-navy-800 border border-white/[0.07] rounded-2xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white text-sm">{title}</span>
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${color}`}>{count}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>
      {open && <div className="border-t border-white/[0.06]">{children}</div>}
    </div>
  );
}

export default function AdminDashboardClient({ stats }: { stats: Stats }) {
  const router = useRouter();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const toggle = (s: string) => setOpenSection(p => p === s ? null : s);

  const markRead = async (id: string) => {
    await supabase.from("contact_submissions").update({ read: true }).eq("id", id);
    toast.success("סומן כנקרא");
    router.refresh();
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const slug = newCategory.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { error } = await supabase.from("categories").insert({ name: newCategory.trim(), slug });
    if (error) { toast.error("שגיאה"); return; }
    toast.success("קטגוריה נוספה!");
    setNewCategory("");
    router.refresh();
  };

  return (
    <div className="space-y-5 p-6" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">לוח בקרה</h1>
          <p className="text-white/30 text-xs mt-0.5">{new Date().toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <Link href="/admin/products/new" className="bg-cyan text-navy-900 font-black px-4 py-2 rounded-xl text-sm hover:bg-cyan-600 transition-colors flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> מוצר חדש
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={Users}       label="לקוחות רשומים"      value={stats.totalCustomers}         color="bg-purple-400/10 text-purple-400" />
        <StatCard icon={Users}       label="לקוחות חדשים החודש" value={stats.newCustomersMonth}      color="bg-indigo-400/10 text-indigo-400" />
        <StatCard icon={ShoppingBag} label="מכירות היום"         value={stats.todayOrders.length}     sub={`₪${stats.todayRevenue.toLocaleString("he-IL")}`} color="bg-cyan/10 text-cyan" />
        <StatCard icon={TrendingUp}  label="מכירות החודש"        value={stats.monthOrders}            sub={`₪${stats.monthRevenue.toLocaleString("he-IL")}`} color="bg-green-400/10 text-green-400" />
        <div className="bg-navy-800 border border-amber-400/30 rounded-2xl p-4 flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-400/10 text-amber-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-white/40 text-xs font-bold">פניות ממתינות לטיפול</span>
          </div>
          <p className="text-2xl font-black text-white leading-none">{stats.unreadContacts.length}</p>
          {stats.unreadContacts.length > 0 && (
            <p className="text-xs font-bold animate-blink" style={{color: "#FFB800", textShadow: "0 0 8px #FFB800"}}>⚠ ממתינות לטיפול</p>
          )}
        </div>
      </div>

      {/* Second Row — Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Chart */}
        <div className="bg-navy-800 border border-white/[0.07] rounded-2xl p-5">
          <p className="text-white font-bold text-sm mb-4">הכנסות — 6 חודשים אחרונים</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₪${v}`} />
                <Tooltip contentStyle={{ background: "#0F2238", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 10, color: "#fff", fontSize: 11 }}
                  formatter={(v: number) => [`₪${v.toLocaleString("he-IL")}`, "הכנסות"]} />
                <Area type="monotone" dataKey="revenue" stroke="#00D4FF" strokeWidth={2} fill="url(#cg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-navy-800 border border-white/[0.07] rounded-2xl p-5">
          <p className="text-white font-bold text-sm mb-4">10 המוצרים הנמכרים ביותר</p>
          {stats.topProducts.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-8">אין נתונים עדיין</p>
          ) : (
            <div className="space-y-2.5">
              {stats.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2.5">
                  <span className="text-white/20 text-xs font-black w-4 text-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-xs font-bold truncate">{p.name}</span>
                      <span className="text-cyan text-xs font-black shrink-0 mr-2">{p.count}</span>
                    </div>
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan to-blue-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (p.count / (stats.topProducts[0]?.count || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accordion Sections */}

      {/* Pending Orders */}
      <Section id="orders" title="הזמנות ממתינות לאישור" count={stats.pendingOrders.length}
        color="text-amber-400 bg-amber-400/10 border-amber-400/20"
        open={openSection === "orders"} onToggle={() => toggle("orders")}>
        {stats.pendingOrders.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-6">אין הזמנות ממתינות 🎉</p>
        ) : stats.pendingOrders.map(order => (
          <div key={order.id} className="px-5 py-3.5 flex items-center justify-between gap-4 border-b border-white/[0.04] last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-white font-bold text-sm truncate">{order.customer_name}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${statusLabel[order.status]?.color}`}>
                  {statusLabel[order.status]?.label}
                </span>
              </div>
              <p className="text-white/30 text-xs">{new Date(order.created_at).toLocaleDateString("he-IL")} • {order.items?.length ?? 0} פריטים</p>
            </div>
            <div className="text-left shrink-0">
              <p className="text-cyan font-black text-sm">₪{Number(order.total).toLocaleString("he-IL")}</p>
              <Link href="/admin/orders" className="text-white/30 text-xs hover:text-white">לפרטים →</Link>
            </div>
          </div>
        ))}
      </Section>

      {/* Contacts */}
      <Section id="contacts" title="פניות שלא נקראו" count={stats.unreadContacts.length}
        color="text-purple-400 bg-purple-400/10 border-purple-400/20"
        open={openSection === "contacts"} onToggle={() => toggle("contacts")}>
        {stats.unreadContacts.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-6">כל הפניות נקראו ✅</p>
        ) : stats.unreadContacts.map(c => (
          <div key={c.id} className="px-5 py-3.5 flex items-start justify-between gap-4 border-b border-white/[0.04] last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-white font-bold text-sm">{c.name}</p>
                <span className="text-white/30 text-xs truncate">{c.email}</span>
              </div>
              <p className="text-white/40 text-xs line-clamp-1">{c.message}</p>
            </div>
            <button onClick={() => markRead(c.id)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 transition-colors shrink-0">
              <CheckCircle className="w-3.5 h-3.5" /> נקרא
            </button>
          </div>
        ))}
      </Section>

      {/* Categories */}
      <Section id="categories" title="קטגוריות" count={stats.categories.length}
        color="text-blue-400 bg-blue-400/10 border-blue-400/20"
        open={openSection === "categories"} onToggle={() => toggle("categories")}>
        <div className="p-4 flex gap-2 border-b border-white/[0.04]">
          <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCategory()}
            placeholder="שם קטגוריה חדשה..."
            className="flex-1 bg-white/5 border border-white/[0.08] rounded-xl px-4 py-2 text-white text-sm placeholder-white/20 outline-none focus:border-cyan/40" />
          <button onClick={addCategory}
            className="bg-cyan text-navy-900 font-black px-4 py-2 rounded-xl text-sm hover:bg-cyan-600 transition-colors">
            + הוסף
          </button>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {stats.categories.map(cat => (
            <div key={cat.id} className="px-5 py-3 flex items-center justify-between">
              <span className="text-white text-sm font-bold">{cat.name}</span>
              <Link href="/admin/categories" className="text-white/30 hover:text-cyan transition-colors p-1">
                <Edit className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* Products */}
      <Section id="products" title="מוצרים באתר" count={stats.products.length}
        color="text-cyan bg-cyan/10 border-cyan/20"
        open={openSection === "products"} onToggle={() => toggle("products")}>
        <div className="p-4 border-b border-white/[0.04]">
          <Link href="/admin/products/new"
            className="inline-flex items-center gap-1.5 bg-cyan text-navy-900 font-black px-4 py-2 rounded-xl text-sm hover:bg-cyan-600 transition-colors">
            <Plus className="w-4 h-4" /> הוסף מוצר חדש
          </Link>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {stats.products.map(p => (
            <div key={p.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-bold">{p.name}</p>
                <p className="text-cyan text-xs font-bold mt-0.5">₪{Number(p.price).toLocaleString("he-IL")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${p.in_stock ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
                  {p.in_stock ? "במלאי" : "אזל"}
                </span>
                <Link href={`/admin/products/${p.id}`} className="text-white/30 hover:text-cyan transition-colors p-1">
                  <Edit className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
}
