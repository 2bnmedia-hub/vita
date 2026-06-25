"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/auth";
import { Package, User, LogOut, ShoppingBag, Clock } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/account/login"); return; }
      const { data: c } = await supabase.from("customers").select("*").eq("id", session.user.id).single();
      if (!c) { router.push("/account/login"); return; }
      if (c.status === "pending") { router.push("/account/pending"); return; }
      setCustomer(c);
      const { data: o } = await supabase.from("customer_orders").select("*").eq("customer_id", session.user.id).order("created_at", { ascending: false }).limit(5);
      setOrders(o ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };

  if (loading) return <div className="min-h-screen bg-navy-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" /></div>;

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400",
    completed: "bg-green-500/15 text-green-400",
    cancelled: "bg-red-500/15 text-red-400",
  };

  return (
    <div className="min-h-screen bg-navy-950 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">שלום, {customer?.full_name?.split(" ")[0]} 👋</h1>
            <p className="text-white/40 mt-1">{customer?.email}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 glass border border-white/[0.08] px-4 py-2 rounded-xl text-white/50 hover:text-red-400 hover:border-red-500/20 transition-all text-sm">
            <LogOut className="w-4 h-4" />התנתק
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/account/orders" className="group p-5 glass border border-white/[0.07] hover:border-cyan/25 rounded-2xl transition-all hover:-translate-y-1">
            <ShoppingBag className="w-6 h-6 text-cyan mb-3" />
            <p className="font-black text-xl">{orders.length}</p>
            <p className="text-white/40 text-sm">הזמנות</p>
          </Link>
          <Link href="/account/profile" className="group p-5 glass border border-white/[0.07] hover:border-cyan/25 rounded-2xl transition-all hover:-translate-y-1">
            <User className="w-6 h-6 text-purple-400 mb-3" />
            <p className="font-black text-sm text-white">הפרופיל שלי</p>
            <p className="text-white/40 text-sm">עדכן פרטים</p>
          </Link>
          <Link href="/shop" className="group p-5 glass border border-white/[0.07] hover:border-cyan/25 rounded-2xl transition-all hover:-translate-y-1">
            <Package className="w-6 h-6 text-green-400 mb-3" />
            <p className="font-black text-sm text-white">לחנות</p>
            <p className="text-white/40 text-sm">הזמן מוצרים</p>
          </Link>
        </div>

        <div className="glass border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="font-bold">הזמנות אחרונות</h2>
            <Link href="/account/orders" className="text-cyan text-sm hover:underline">כל ההזמנות</Link>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>אין הזמנות עדיין</p>
              <Link href="/shop" className="text-cyan text-sm hover:underline mt-2 block">לחנות →</Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {orders.map(o => (
                <div key={o.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">הזמנה #{o.id.slice(0,8)}</p>
                    <p className="text-white/40 text-xs">{new Date(o.created_at).toLocaleDateString("he-IL")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusColors[o.status] ?? "bg-white/10 text-white/50"}`}>
                      {o.status === "pending" ? "ממתין" : o.status === "completed" ? "הושלם" : "בוטל"}
                    </span>
                    <span className="font-black text-white">₪{o.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
