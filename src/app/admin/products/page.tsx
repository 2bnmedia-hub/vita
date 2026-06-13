"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Plus, Edit, Trash2, Search, Package } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm("למחוק את " + name + "?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  const filtered = products.filter(p =>
    p.name?.includes(search) || p.flavor?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">מוצרים</h1>
          <p className="text-white/40 text-sm">{products.length} מוצרים</p>
        </div>
        <Link href="/admin/products/new"
          className="btn-primary bg-cyan text-navy-900 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-cyan-600 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> מוצר חדש
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפש מוצר..."
          className="w-full bg-navy-800 border border-white/[0.08] rounded-xl pr-11 pl-4 py-3 text-white text-sm placeholder-white/25"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-navy-800 animate-pulse" />)}
        </div>
      ) : (
        <div className="glass border border-white/[0.07] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase tracking-wider">מוצר</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase tracking-wider hidden md:table-cell">טעם</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase tracking-wider">מחיר</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase tracking-wider hidden md:table-cell">מלאי</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-navy-700 flex items-center justify-center text-lg flex-shrink-0">
                        {p.flavor?.includes("ענבים") ? "🍇" : p.flavor?.includes("פירות") ? "🍹" : p.name?.includes("טבליות") ? "💊" : "🏋️"}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{p.name}</p>
                        <p className="text-white/30 text-xs">{p.weight}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-white/50 text-sm">{p.flavor ?? "—"}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-white">₪{p.price}</span>
                    {p.compare_price && <span className="text-white/30 text-xs line-through mr-1">₪{p.compare_price}</span>}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${p.in_stock ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                      {p.in_stock ? "במלאי" : "אזל"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={"/admin/products/" + p.id}
                        className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:border-cyan/30 hover:text-cyan transition-all">
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => handleDelete(p.id, p.name)}
                        className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:border-red-500/30 hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-white/30">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>לא נמצאו מוצרים</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
