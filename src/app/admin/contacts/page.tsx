"use client";
import { adminList } from "@/lib/adminApi";
import { useEffect, useState } from "react";

import { MessageSquare, Phone, Mail } from "lucide-react";



export default function AdminContacts() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    adminList("contact_submissions")
      .then(({ data }) => { setContacts(data ?? []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">פניות לקוחות</h1><p className="text-slate-600 text-sm">{contacts.length} פניות</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 admin-card overflow-hidden">
          {loading ? <div className="h-32 flex items-center justify-center"><div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" /></div> :
          contacts.length === 0 ? <div className="text-center py-10 text-slate-500"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>אין פניות</p></div> :
          <div className="divide-y divide-slate-100">
            {contacts.map(c => (
              <button key={c.id} onClick={() => setSelected(c)} className={`w-full text-right px-4 py-3.5 hover:bg-slate-50 transition-colors ${selected?.id === c.id ? "bg-teal-50 border-r-2 border-teal-600" : ""}`}>
                <p className="font-semibold text-slate-900 text-sm">{c.name}</p>
                <p className="text-slate-600 text-xs mt-0.5 truncate">{c.message}</p>
                <p className="text-slate-500 text-xs mt-1">{new Date(c.created_at).toLocaleDateString("he-IL")}</p>
              </button>
            ))}
          </div>}
        </div>
        <div className="lg:col-span-2">
          {selected ? (
            <div className="admin-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900">{selected.name}</h2>
                <span className="text-slate-500 text-xs">{new Date(selected.created_at).toLocaleDateString("he-IL")}</span>
              </div>
              <div className="space-y-2">
                <a href={"mailto:" + selected.email} className="flex items-center gap-2 text-teal-700 text-sm hover:underline"><Mail className="w-4 h-4" />{selected.email}</a>
                {selected.phone && <a href={"tel:" + selected.phone} className="flex items-center gap-2 text-teal-700 text-sm hover:underline"><Phone className="w-4 h-4" />{selected.phone}</a>}
              </div>
              <div className="admin-card p-4">
                <p className="text-slate-700 text-sm leading-relaxed">{selected.message}</p>
              </div>
              <a href={"mailto:" + selected.email} className="inline-flex items-center gap-2 bg-teal-700 text-white font-bold px-5 py-2.5 rounded-full text-sm hover:bg-teal-800 transition-colors">
                <Mail className="w-4 h-4" /> השב במייל
              </a>
            </div>
          ) : (
            <div className="admin-card h-48 flex items-center justify-center text-slate-500">
              <div className="text-center"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">בחר פנייה לצפייה</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
