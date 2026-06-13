"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Plus, Edit, Trash2, Tag, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminCategories() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const fetchCats = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    if (error) toast.error("שגיאה בטעינת קטגוריות");
    else setCats(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCats(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-") };
    
    if (editing) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
      if (error) toast.error("שגיאה בעדכון: " + error.message);
      else toast.success("הקטגוריה עודכנה בהצלחה ✓");
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) toast.error("שגיאה בהוספה: " + error.message);
      else toast.success("הקטגוריה נוספה בהצלחה ✓");
    }
    
    setForm({ name: "", slug: "", description: "" });
    setEditing(null);
    setSaving(false);
    fetchCats();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm("למחוק את " + name + "?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error("שגיאה במחיקה: " + error.message);
    else toast.success("הקטגוריה נמחקה");
    fetchCats();
  };

  const startEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const field = "w-full bg-navy-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20";
  const label = "text-white/50 text-xs font-bold uppercase tracking-wider block mb-1.5";

  return (
    <div className="space-y-6 max-w-3xl">
      <div><h1 className="text-2xl font-black">קטגוריות</h1><p className="text-white/40 text-sm">{cats.length} קטגוריות</p></div>
      
      <form onSubmit={handleSave} className="glass border border-white/[0.07] rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-white/60 text-sm uppercase tracking-wider">
          {editing ? "✏️ עריכת: " + editing.name : "➕ קטגוריה חדשה"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={label}>שם *</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={field} placeholder="קריאטין אבקה" /></div>
          <div><label className={label}>Slug</label><input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className={field} placeholder="creatine-powder" /></div>
        </div>
        <div><label className={label}>תיאור</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={field} placeholder="תיאור הקטגוריה..." /></div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-cyan text-navy-900 font-black px-5 py-2.5 rounded-xl text-sm hover:bg-cyan-600 transition-colors flex items-center gap-2 disabled:opacity-50">
            {saving ? "שומר..." : <><Plus className="w-4 h-4" />{editing ? "עדכן" : "הוסף"}</>}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ name: "", slug: "", description: "" }); }}
              className="glass border border-white/[0.08] text-white/60 px-5 py-2.5 rounded-xl text-sm hover:text-white transition-all">
              ביטול
            </button>
          )}
        </div>
      </form>

      <div className="glass border border-white/[0.07] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="h-32 flex items-center justify-center"><div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" /></div>
        ) : cats.length === 0 ? (
          <div className="text-center py-10 text-white/30"><Tag className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>אין קטגוריות עדיין</p></div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.06]">
              <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase">שם</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase hidden md:table-cell">Slug</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase hidden md:table-cell">תיאור</th>
              <th className="px-5 py-3" />
            </tr></thead>
            <tbody className="divide-y divide-white/[0.04]">
              {cats.map(c => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-4"><span className="font-semibold text-white text-sm">{c.name}</span></td>
                  <td className="px-5 py-4 hidden md:table-cell"><span className="text-white/40 text-xs font-mono">{c.slug}</span></td>
                  <td className="px-5 py-4 hidden md:table-cell"><span className="text-white/40 text-xs">{c.description ?? "—"}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => startEdit(c)} className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:text-cyan hover:border-cyan/30 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(c.id, c.name)} className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:text-red-400 hover:border-red-500/30 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
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
