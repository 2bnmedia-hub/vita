"use client";
import { adminWrite } from "@/lib/adminApi";
import { supabase } from "@/lib/auth";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Search, Package, Upload, Download, Eye } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { ProductImage } from "@/components/shop/ProductImage";

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm("למחוק את " + name + "?")) return;
    await adminWrite("products", { op: "delete", id });
    fetchProducts();
  };

  const downloadTemplate = () => {
    const headers = ["name","slug","description","price","compare_price","category","flavor","weight","servings","serving_size","in_stock","featured","badge"];
    const example = ["קריאטין מונוהידראט — ללא טעם","creatine-unflavored","תיאור קצר","89","109","קריאטין","ללא טעם","500g","166","3g","true","true","הנמכר ביותר"];
    const csv = [headers.join(","), example.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vita-products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    let headers: string[] = [];
    let dataRows: any[][] = [];

    if (isExcel) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      headers = (json[0] || []).map((h: any) => String(h).trim());
      dataRows = json.slice(1).map(row => row.map((v: any) => (v === undefined || v === null ? "" : String(v).trim())));
    } else {
      // Read as ArrayBuffer to detect/handle encoding properly, then decode as UTF-8 first.
      const buffer = await file.arrayBuffer();
      let text = new TextDecoder("utf-8").decode(buffer);
      // Heuristic: if decoding produced replacement characters, retry with windows-1255 (Hebrew)
      if (text.includes("\ufffd")) {
        text = new TextDecoder("windows-1255").decode(buffer);
      }
      const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
      const rowsRaw = parsed.data as string[][];
      headers = (rowsRaw[0] || []).map(h => String(h).trim().replace(/^"|"$/g, ""));
      dataRows = rowsRaw.slice(1).map(row => row.map(v => String(v ?? "").trim()));
    }

    const rows = dataRows.map(values => {
      const obj: any = {};
      headers.forEach((h, i) => {
        if (h === "price" || h === "compare_price" || h === "servings") {
          obj[h] = Number(values[i]) || null;
        } else if (h === "in_stock" || h === "featured") {
          obj[h] = String(values[i]).toLowerCase() === "true";
        } else {
          obj[h] = values[i] || null;
        }
      });
      if (!obj.slug && obj.name) {
        const base = (obj.flavor ? obj.name + "-" + obj.flavor : obj.name);
        obj.slug = base.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-א-ת]/g, "");
      }
      return obj;
    });

    // Ensure slugs are unique within this batch (append index if duplicate)
    const seenSlugs: Record<string, number> = {};
    rows.forEach((r: any) => {
      if (!r.slug) return;
      if (seenSlugs[r.slug] !== undefined) {
        seenSlugs[r.slug] += 1;
        r.slug = r.slug + "-" + seenSlugs[r.slug];
      } else {
        seenSlugs[r.slug] = 0;
      }
    });

    const filteredRows = rows.filter((r: any) => r.name && r.slug);

    if (filteredRows.length === 0) {
      toast.error("לא נמצאו מוצרים בקובץ");
      setImporting(false);
      return;
    }

    const { error } = await adminWrite("products", { op: "upsert", values: filteredRows, onConflict: "slug" });
    
    if (error) {
      toast.error("שגיאה בייבוא: " + error.message);
    } else {
      toast.success(`${filteredRows.length} מוצרים יובאו בהצלחה!`);
      fetchProducts();
    }
    
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const filtered = products.filter(p =>
    p.name?.includes(search) || p.flavor?.includes(search)
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">מוצרים</h1>
          <p className="text-slate-600 text-sm">{products.length} מוצרים</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={downloadTemplate}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-slate-900 font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
            <Download className="w-4 h-4" /> טמפלט CSV
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="flex items-center gap-2 bg-white border border-slate-200 border border-green-200 hover:border-green-400/60 text-green-800 font-bold px-4 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50">
            <Upload className="w-4 h-4" /> {importing ? "מייבא..." : "ייבא CSV/Excel"}
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
          <Link href="/admin/products/new"
            className="flex items-center gap-2 bg-teal-700 text-white font-bold px-4 py-2.5 rounded-full text-sm hover:bg-teal-800 transition-colors">
            <Plus className="w-4 h-4" /> מוצר חדש
          </Link>
        </div>
      </div>

      {/* Import info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-blue-800 text-xs">
        💡 הורד את טמפלט ה-CSV, מלא את המוצרים ב-Excel, ואז ייבא חזרה. מוצרים קיימים יתעדכנו לפי ה-slug.
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="חפש מוצר..."
          className="w-full bg-white border border-slate-200 rounded-xl pr-11 pl-4 py-3 text-slate-900 text-sm placeholder-slate-400" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white animate-pulse" />)}
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">מוצר</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider hidden md:table-cell">טעם</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">מחיר</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider hidden md:table-cell">מלאי</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                        <ProductImage
                          key={p.images?.[0] ?? p.id}
                          src={p.images?.[0]}
                          alt={p.name}
                          className="w-full h-full object-contain p-1"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                        <p className="text-slate-500 text-xs">{p.weight}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-slate-600 text-sm">{p.flavor ?? "—"}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-slate-900">₪{p.price}</span>
                    {p.compare_price && <span className="text-slate-500 text-xs line-through mr-1">₪{p.compare_price}</span>}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${p.in_stock ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                        {p.in_stock ? "במלאי" : "אזל"}
                      </span>
                      <input
                        type="number"
                        min={0}
                        defaultValue={p.stock_quantity ?? ""}
                        placeholder="ללא הגבלה"
                        title="כמות במלאי (ריק = ללא הגבלה)"
                        onBlur={async (e) => {
                          const raw = e.target.value.trim();
                          const value = raw === "" ? null : Math.max(0, parseInt(raw, 10));
                          await adminWrite("products", { op: "update", id: p.id, values: { stock_quantity: value } });
                          fetchProducts();
                        }}
                        className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={"/shop/" + encodeURIComponent(p.slug)} target="_blank" rel="noreferrer"
                        aria-label={`צפה באתר במוצר ${p.name}`} title="צפייה באתר"
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-teal-300 hover:text-teal-700 transition-all">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link href={"/admin/products/" + p.id}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-teal-300 hover:text-teal-700 transition-all">
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => handleDelete(p.id, p.name)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-red-200 hover:text-red-700 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>לא נמצאו מוצרים</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
