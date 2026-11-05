"use client";
import { adminWrite } from "@/lib/adminApi";
import { supabase } from "@/lib/auth";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Package, ShoppingBag, MessageSquare, Users, TrendingUp, CheckCircle, Plus, Edit, ChevronDown, ChevronUp, Tag, UserPlus, Inbox } from "lucide-react";
import Link from "next/link";
import { ADMIN_FIELD } from "@/components/admin/ui";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";



const statusLabel: Record<string, { label: string; color: string }> = {
  pending:   { label: "ממתין",  color: "text-amber-800 bg-amber-50 border-amber-200" },
  confirmed: { label: "אושר",   color: "text-teal-800 bg-teal-50 border-teal-200" },
  shipped:   { label: "נשלח",   color: "text-blue-800 bg-blue-50 border-blue-200" },
  delivered: { label: "נמסר",   color: "text-green-800 bg-green-50 border-green-200" },
  cancelled: { label: "בוטל",   color: "text-red-800 bg-red-50 border-red-200" },
};

const nis = (n: number) => `₪${Number(n).toLocaleString("he-IL")}`;

function Card({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`admin-card ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 px-5 h-14 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Empty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
      <Icon className="w-8 h-8 mb-2 text-slate-400" aria-hidden="true" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, alert }: { icon: any; label: string; value: string | number; sub?: string; alert?: boolean }) {
  return (
    <div className="admin-card p-4 md:p-5 flex flex-col">
      <div className="flex items-center gap-2 text-slate-600 text-sm font-medium leading-tight mb-3">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${alert ? "bg-amber-50 text-amber-800" : "bg-teal-50 text-teal-700"}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
        {label}
      </div>
      <p className="mt-auto text-3xl font-bold text-slate-900 leading-none tabular-nums">{value}</p>
      {sub && <p className="text-slate-600 text-sm mt-1.5 tabular-nums" dir="ltr" style={{ textAlign: "right" }}>{sub}</p>}
    </div>
  );
}

function Section({ title, count, open, onToggle, children }: any) {
  return (
    <section className="admin-card overflow-hidden">
      <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between px-5 h-14 hover:bg-slate-50 transition-colors">
        <span className="flex items-center gap-2.5">
          <span className="font-bold text-slate-900 text-base">{title}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 tabular-nums">{count}</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
      </button>
      {open && <div className="border-t border-slate-100">{children}</div>}
    </section>
  );
}

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

export default function AdminDashboardClient({ stats }: { stats: Stats }) {
  const router = useRouter();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const toggle = (s: string) => setOpenSection(p => p === s ? null : s);

  const markRead = async (id: string) => {
    await adminWrite("contact_submissions", { op: "update", id, values: { read: true } });
    toast.success("סומן כנקרא");
    router.refresh();
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const slug = newCategory.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { error } = await adminWrite("categories", { op: "insert", values: { name: newCategory.trim(), slug } });
    if (error) { toast.error("שגיאה"); return; }
    toast.success("קטגוריה נוספה!");
    setNewCategory("");
    router.refresh();
  };

  const quick = [
    { href: "/admin/products/new", label: "מוצר חדש", icon: Plus, primary: true },
    { href: "/admin/orders", label: "הזמנות", icon: ShoppingBag },
    { href: "/admin/categories", label: "קטגוריות", icon: Tag },
    { href: "/admin/contacts", label: "פניות", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6 max-w-7xl" dir="rtl">
      <h1 className="sr-only">לוח בקרה</h1>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-slate-600 text-base">{new Date().toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        <div className="flex flex-wrap gap-2">
          {quick.map(({ href, label, icon: Icon, primary }) => (
            <Link key={href} href={href}
              className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold transition-colors ${primary ? "bg-teal-700 text-white hover:bg-teal-800" : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"}`}>
              <Icon className="w-4 h-4" aria-hidden="true" />{label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat icon={Users} label="לקוחות רשומים" value={stats.totalCustomers} />
        <Stat icon={UserPlus} label="לקוחות חדשים החודש" value={stats.newCustomersMonth} />
        <Stat icon={ShoppingBag} label="מכירות היום" value={stats.todayOrders.length} sub={nis(stats.todayRevenue)} />
        <Stat icon={TrendingUp} label="מכירות החודש" value={stats.monthOrders} sub={nis(stats.monthRevenue)} />
        <Stat icon={MessageSquare} label="פניות לטיפול" value={stats.unreadContacts.length} alert={stats.unreadContacts.length > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="הזמנות ממתינות לאישור" action={<Link href="/admin/orders" className="text-sm font-semibold text-teal-700 hover:underline">לכל ההזמנות</Link>}>
          {stats.pendingOrders.length === 0 ? <Empty icon={Inbox} text="אין הזמנות ממתינות" /> : (
            <ul className="divide-y divide-slate-100">
              {stats.pendingOrders.map(order => (
                <li key={order.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-slate-900 font-semibold text-base truncate">{order.customer_name}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${statusLabel[order.status]?.color}`}>{statusLabel[order.status]?.label}</span>
                    </div>
                    <p className="text-slate-600 text-sm">{new Date(order.created_at).toLocaleDateString("he-IL")} · {order.items?.length ?? 0} פריטים</p>
                  </div>
                  <p className="text-slate-900 font-bold text-base shrink-0 tabular-nums" dir="ltr">{nis(order.total)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="פניות שלא נקראו" action={<Link href="/admin/contacts" className="text-sm font-semibold text-teal-700 hover:underline">לכל הפניות</Link>}>
          {stats.unreadContacts.length === 0 ? <Empty icon={CheckCircle} text="כל הפניות נקראו" /> : (
            <ul className="divide-y divide-slate-100">
              {stats.unreadContacts.map(c => (
                <li key={c.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 mb-0.5">
                      <p className="text-slate-900 font-semibold text-base">{c.name}</p>
                      <span className="text-slate-600 text-sm truncate" dir="ltr">{c.email}</span>
                    </div>
                    <p className="text-slate-700 text-sm line-clamp-1">{c.message}</p>
                  </div>
                  <button onClick={() => markRead(c.id)}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-700" aria-hidden="true" /> נקרא
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="הכנסות — 6 חודשים אחרונים">
          <div className="h-56 p-4" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₪${v}`} width={56} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#0f172a", fontSize: 13 }}
                  formatter={(v: any) => [nis(Number(v)), "הכנסות"]} />
                <Area type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={2} fill="#ccfbf1" fillOpacity={0.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="10 המוצרים הנמכרים ביותר">
          {stats.topProducts.length === 0 ? <Empty icon={Package} text="אין נתונים עדיין" /> : (
            <ol className="p-5 space-y-3">
              {stats.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="text-slate-500 text-sm font-semibold w-5 text-center shrink-0 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-900 text-sm font-medium truncate">{p.name}</span>
                      <span className="text-slate-700 text-sm font-semibold shrink-0 mr-2 tabular-nums">{p.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(100, (p.count / (stats.topProducts[0]?.count || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Section title="קטגוריות" count={stats.categories.length} open={openSection === "categories"} onToggle={() => toggle("categories")}>
        <div className="p-4 flex gap-2 border-b border-slate-100">
          <label htmlFor="dash-new-category" className="sr-only">שם קטגוריה חדשה</label>
          <input id="dash-new-category" value={newCategory} onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCategory()}
            placeholder="שם קטגוריה חדשה..."
            className={ADMIN_FIELD + " flex-1"} />
          <button onClick={addCategory} className="h-11 px-5 rounded-full bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors shrink-0">
            + הוסף
          </button>
        </div>
        <ul className="divide-y divide-slate-100">
          {stats.categories.map(cat => (
            <li key={cat.id} className="px-5 py-3 flex items-center justify-between">
              <span className="text-slate-900 text-base">{cat.name}</span>
              <Link href="/admin/categories" aria-label={`עריכת ${cat.name}`} className="text-slate-500 hover:text-teal-700 transition-colors p-2 rounded-lg">
                <Edit className="w-4 h-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="מוצרים באתר" count={stats.products.length} open={openSection === "products"} onToggle={() => toggle("products")}>
        <ul className="divide-y divide-slate-100">
          {stats.products.map(p => (
            <li key={p.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-slate-900 text-base truncate">{p.name}</p>
                <p className="text-slate-600 text-sm mt-0.5 tabular-nums">{nis(p.price)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${p.in_stock ? "text-green-800 bg-green-50 border-green-200" : "text-red-800 bg-red-50 border-red-200"}`}>
                  {p.in_stock ? "במלאי" : "אזל"}
                </span>
                <Link href={`/admin/products/${p.id}`} aria-label={`עריכת ${p.name}`} className="text-slate-500 hover:text-teal-700 transition-colors p-2 rounded-lg">
                  <Edit className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
