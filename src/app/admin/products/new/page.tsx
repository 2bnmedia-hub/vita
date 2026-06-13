"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ArrowRight, Loader2, Save } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const empty = {
  name: "", slug: "", description: "", long_description: "",
  price: "", compare_price: "", flavor: "", weight: "",
  servings: "", serving_size: "", category: "קריאטין",
  in_stock: true, featured: false, badge: "",
};

export default function AdminProductEdit() {
  const router = useRouter();
  const params = useParams();
  // new product mode
  const isNew = true;
  const [form, setForm] = useState<any>(empty);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => setCategories(data ?? []));
    if (!isNew) {
      supabase.from("products").select("*").eq("id", params.id).single()
        .then(({ data }) => { if (data) setForm(data); setLoading(false); });
    }
  }, [params.id, isNew]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      servings: form.servings ? Number(form.servings) : null,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
    };
    if (isNew) {
      await supabase.from("products").insert(payload);
    } else {
      await supabase.from("products").update(payload).eq("id", params.id);
    }
    setSaving(false);
    router.push("/admin/products");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" /></div>;

  const field = "w-full bg-navy-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20";
  const label = "text-white/50 text-xs font-bold uppercase tracking-wider block mb-1.5";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:border-white/20 transition-all">
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black">{isNew ? "מוצר חדש" : "עריכת מוצר"}</h1>
          <p className="text-white/40 text-sm">{isNew ? "הוסף מוצר לחנות" : form.name}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic info */}
        <div className="glass border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-white/60 text-sm uppercase tracking-wider">פרטים בסיסיים</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={label}>שם מוצר *</label><input required value={form.name} onChange={e => set("name", e.target.value)} className={field} placeholder="קריאטין מונוהידראט" /></div>
            <div><label className={label}>Slug</label><input value={form.slug} onChange={e => set("slug", e.target.value)} className={field} placeholder="creatine-unflavored" /></div>
          </div>
          <div><label className={label}>תיאור קצר</label><input value={form.description} onChange={e => set("description", e.target.value)} className={field} placeholder="תיאור קצר..." /></div>
          <div><label className={label}>תיאור מלא</label><textarea value={form.long_description} onChange={e => set("long_description", e.target.value)} rows={4} className={field + " resize-none"} placeholder="תיאור מפורט..." /></div>
        </div>

        {/* Pricing */}
        <div className="glass border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-white/60 text-sm uppercase tracking-wider">תמחור</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={label}>מחיר ₪ *</label><input required type="number" value={form.price} onChange={e => set("price", e.target.value)} className={field} placeholder="89" /></div>
            <div><label className={label}>מחיר מקורי ₪</label><input type="number" value={form.compare_price} onChange={e => set("compare_price", e.target.value)} className={field} placeholder="109" /></div>
          </div>
        </div>

        {/* Details */}
        <div className="glass border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-white/60 text-sm uppercase tracking-wider">פרטי מוצר</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className={label}>טעם</label><input value={form.flavor} onChange={e => set("flavor", e.target.value)} className={field} placeholder="ענבים" /></div>
            <div><label className={label}>משקל</label><input value={form.weight} onChange={e => set("weight", e.target.value)} className={field} placeholder="500g" /></div>
            <div><label className={label}>מנות</label><input type="number" value={form.servings} onChange={e => set("servings", e.target.value)} className={field} placeholder="166" /></div>
            <div><label className={label}>גודל מנה</label><input value={form.serving_size} onChange={e => set("serving_size", e.target.value)} className={field} placeholder="3g" /></div>
            <div><label className={label}>באדג</label><input value={form.badge} onChange={e => set("badge", e.target.value)} className={field} placeholder="פופולרי" /></div>
            <div>
              <label className={label}>קטגוריה</label>
              <select value={form.category} onChange={e => set("category", e.target.value)} className={field + " cursor-pointer"}>
                <option value="קריאטין">קריאטין</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.in_stock} onChange={e => set("in_stock", e.target.checked)} className="w-4 h-4 accent-cyan" />
              <span className="text-white/70 text-sm font-medium">במלאי</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} className="w-4 h-4 accent-cyan" />
              <span className="text-white/70 text-sm font-medium">מוצר מומלץ</span>
            </label>
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="btn-primary flex items-center gap-2 bg-cyan text-navy-900 font-black px-6 py-3 rounded-xl hover:bg-cyan-600 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "שומר..." : "שמור מוצר"}
          </button>
          <Link href="/admin/products" className="glass border border-white/[0.08] text-white/60 hover:text-white font-medium px-6 py-3 rounded-xl transition-all">
            ביטול
          </Link>
        </div>
      </form>
    </div>
  );
}
