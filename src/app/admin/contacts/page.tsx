"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { MessageSquare, Phone, Mail } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminContacts() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    supabase.from("contact_submissions").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setContacts(data ?? []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-black">פניות לקוחות</h1><p className="text-white/40 text-sm">{contacts.length} פניות</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 glass border border-white/[0.07] rounded-2xl overflow-hidden">
          {loading ? <div className="h-32 flex items-center justify-center"><div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" /></div> :
          contacts.length === 0 ? <div className="text-center py-10 text-white/30"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>אין פניות</p></div> :
          <div className="divide-y divide-white/[0.04]">
            {contacts.map(c => (
              <button key={c.id} onClick={() => setSelected(c)} className={`w-full text-right px-4 py-3.5 hover:bg-white/[0.03] transition-colors ${selected?.id === c.id ? "bg-cyan/5 border-r-2 border-cyan" : ""}`}>
                <p className="font-semibold text-white text-sm">{c.name}</p>
                <p className="text-white/40 text-xs mt-0.5 truncate">{c.message}</p>
                <p className="text-white/20 text-xs mt-1">{new Date(c.created_at).toLocaleDateString("he-IL")}</p>
              </button>
            ))}
          </div>}
        </div>
        <div className="lg:col-span-2">
          {selected ? (
            <div className="glass border border-white/[0.07] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white">{selected.name}</h2>
                <span className="text-white/30 text-xs">{new Date(selected.created_at).toLocaleDateString("he-IL")}</span>
              </div>
              <div className="space-y-2">
                <a href={"mailto:" + selected.email} className="flex items-center gap-2 text-cyan text-sm hover:underline"><Mail className="w-4 h-4" />{selected.email}</a>
                {selected.phone && <a href={"tel:" + selected.phone} className="flex items-center gap-2 text-cyan text-sm hover:underline"><Phone className="w-4 h-4" />{selected.phone}</a>}
              </div>
              <div className="glass border border-white/[0.06] rounded-xl p-4">
                <p className="text-white/70 text-sm leading-relaxed">{selected.message}</p>
              </div>
              <a href={"mailto:" + selected.email} className="inline-flex items-center gap-2 bg-cyan text-navy-900 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-cyan-600 transition-colors">
                <Mail className="w-4 h-4" /> השב במייל
              </a>
            </div>
          ) : (
            <div className="glass border border-white/[0.07] rounded-2xl h-48 flex items-center justify-center text-white/30">
              <div className="text-center"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">בחר פנייה לצפייה</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
