"use client";
import { useEffect, useState } from "react";

import { CheckCircle, XCircle, Users, Search } from "lucide-react";
import toast from "react-hot-toast";



export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadCustomers = async () => {
    const res = await fetch("/api/admin/customers");
    const data = await res.json();
    setCustomers(data.customers ?? []);
    setLoading(false);
  };

  useEffect(() => { loadCustomers(); }, []);

  const approve = async (id: string, name: string) => {
    if (id.startsWith("fallback_")) {
      const customer = customers.find(c => c.id === id);
      if (!customer) return;
      const tid = toast.loading("יוצר חשבון עבור " + name + "...");
      try {
        const res = await fetch("/api/admin/promote-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactId: id,
            email: customer.email,
            fullName: customer.full_name,
            phone: customer.phone,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "שגיאה");
        toast.success(name + " אושר ✓ — נשלח לינק איפוס סיסמה", { id: tid });
        loadCustomers();
      } catch (err: any) {
        toast.error("שגיאה: " + err.message, { id: tid });
      }
      return;
    }
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    if (!res.ok) toast.error("שגיאה באישור");
    else { toast.success(name + " אושר בהצלחה ✓"); loadCustomers(); }
  };

  const reject = async (id: string, name: string) => {
    if (id.startsWith("fallback_")) {
      await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      toast.success("הרשמת " + name + " נמחקה");
      loadCustomers();
      return;
    }
    if (!confirm("לדחות את " + name + "?")) return;
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    if (!res.ok) toast.error("שגיאה");
    else { toast.success("הלקוח נדחה"); loadCustomers(); }
  };

  const filtered = customers.filter(c => {
    const matchSearch = c.full_name?.includes(search) || c.email?.includes(search);
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  });

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    approved: "bg-green-500/15 text-green-400 border-green-500/20",
    rejected: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  const statusLabels: Record<string, string> = { pending: "ממתין", approved: "מאושר", rejected: "נדחה" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black">לקוחות</h1><p className="text-white/40 text-sm">{customers.length} לקוחות · {customers.filter(c => c.status === "pending").length} ממתינים לאישור</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חפש לקוח..." className="w-full bg-navy-800 border border-white/[0.08] rounded-xl pr-11 pl-4 py-3 text-white text-sm placeholder-white/25" />
        </div>
        <div className="flex gap-2">
          {[["all", "הכל"], ["pending", "ממתינים"], ["approved", "מאושרים"], ["rejected", "נדחו"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === v ? "bg-cyan text-navy-900" : "glass border border-white/[0.08] text-white/50 hover:text-white"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="glass border border-white/[0.07] rounded-2xl overflow-hidden">
        {loading ? <div className="h-32 flex items-center justify-center"><div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" /></div> :
        filtered.length === 0 ? <div className="text-center py-12 text-white/30"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>לא נמצאו לקוחות</p></div> :
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.06]">
            <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase">לקוח</th>
            <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase hidden md:table-cell">טלפון</th>
            <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase hidden md:table-cell">תאריך הרשמה</th>
            <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase">סטטוס</th>
            <th className="px-5 py-3" />
          </tr></thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-white/[0.02]">
                <td className="px-5 py-4">
                  <p className="font-semibold text-white text-sm">{c.full_name ?? "—"}</p>
                  <p className="text-white/30 text-xs">{c.email}</p>
                  {c._fallback && <span className="text-amber-400/70 text-[10px] font-bold">⚠ ממתין ליצירת חשבון</span>}
                </td>
                <td className="px-5 py-4 hidden md:table-cell"><span className="text-white/40 text-sm">{c.phone ?? "—"}</span></td>
                <td className="px-5 py-4 hidden md:table-cell"><span className="text-white/40 text-xs">{new Date(c.created_at).toLocaleDateString("he-IL")}</span></td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColors[c.status] ?? ""}`}>
                    {statusLabels[c.status] ?? c.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {c.status === "pending" && (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => approve(c.id, c.full_name)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all">
                        <CheckCircle className="w-3.5 h-3.5" />אשר
                      </button>
                      <button onClick={() => reject(c.id, c.full_name)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">
                        <XCircle className="w-3.5 h-3.5" />דחה
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
    </div>
  );
}
