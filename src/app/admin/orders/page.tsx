"use client";
import { supabase } from "@/lib/auth";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";

const statusColors: Record<string, string> = {
  pending:   "bg-amber-500/15 text-amber-400 border-amber-500/20",
  confirmed: "bg-cyan/15 text-cyan border-cyan/20",
  shipped:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
  delivered: "bg-green-500/15 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  pending:   "ממתין",
  confirmed: "אושר",
  shipped:   "נשלח",
  delivered: "נמסר",
  cancelled: "בוטל",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    loadOrders();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-white">הזמנות</h1>
        <p className="text-white/40 text-sm">{orders.length} הזמנות</p>
      </div>

      <div className="glass border border-white/[0.07] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>אין הזמנות עדיין</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase">לקוח</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase hidden md:table-cell">תאריך</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase hidden sm:table-cell">כתובת</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase">סכום</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white text-sm">{o.customer_name}</p>
                    <p className="text-white/30 text-xs">{o.customer_email}</p>
                    {o.customer_phone && <p className="text-white/30 text-xs">{o.customer_phone}</p>}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-white/40 text-xs">
                      {new Date(o.created_at).toLocaleDateString("he-IL")}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-white/40 text-xs">{o.address ?? "—"}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-white">₪{Number(o.total).toLocaleString("he-IL")}</span>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer bg-transparent ${
                        statusColors[o.status] ?? "bg-white/10 text-white/50 border-white/10"
                      }`}
                    >
                      {Object.entries(statusLabels).map(([v, l]) => (
                        <option key={v} value={v} className="bg-navy-800 text-white">{l}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
