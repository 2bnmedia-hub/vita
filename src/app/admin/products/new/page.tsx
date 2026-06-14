"use client";
import { supabase } from "@/lib/auth";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Save, Upload, X, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

const empty = {
  name: "", slug: "", description: "", long_description: "",
  price: "", compare_price: "", flavor: "", weight: "",
  servings: "", serving_size: "", category: "קריאטין",
  in_stock: true, featured: false, badge: "", images: [],
};

export default function AdminProductNew() {
  const router = useRouter();
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => setCategories(data ?? []));
  }, []);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) { toast.error("שגיאה בהעלאת תמונה"); continue; }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      uploadedUrls.push(data.publicUrl);
    }

    setForm((f: any) => ({ ...f, images: [...(f.images || []), ...uploadedUrls] }));
    setUploading(false);
    toast.success(`${uploadedUrls.length} תמונות הועלו!`);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (url: string) => {
    setForm((f: any) => ({ ...f, images: f.images.filter((i: string) => i !== url) }));
  };

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
    const { error } = await supabase.from("products").insert(payload);
    if (error) { toast.error("שגיאה בשמירה"); setSaving(false); return; }
    toast.success("מוצר נוסף!");
    router.push("/admin/products");
  };

  const field = "w-full bg-navy-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20";
  const label = "text-white/50 text-xs font-bold uppercase tracking-wider block mb-1.5";

  return (
    <div className="max-w-3xl space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:border-white/20 transition-all">
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">מוצר חדש</h1>
          <p className="text-white/40 text-sm">הוסף מוצר לחנות</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* תמונות */}
        <div className="glass border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-white/60 text-sm uppercase tracking-wider">תמונות מוצר</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {(form.images || []).map((url: string, i: number) => (
              <div key={url} className="relative group aspect-square rounded-xl overflow-hidden bg-navy-700">
                <img src={url} alt="" className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute top-1 right-1 bg-cyan text-navy-900 text-[10px] font-black px-1.5 py-0.5 rounded">ראשית</span>}
                <button type="button" onClick={() => removeImage(url)}
                  className="absolute top-1 left-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-cyan/40 flex flex-col items-center justify-center gap-1 text-white/30 hover:text-cyan transition-all">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /><span className="text-xs">העלה</span></>}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
          <p className="text-white/20 text-xs">התמונה הראשונה תהיה תמונת הכריכה. ניתן להעלות מספר תמונות.</p>
        </div>

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

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-cyan text-navy-900 font-black px-6 py-3 rounded-xl hover:bg-cyan-600 transition-colors disabled:opacity-50">
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
