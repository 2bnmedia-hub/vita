"use client";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, ChevronDown, Trash2, X, Mail, Phone, User, Clock, Send, Search, CreditCard, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

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

const paymentColors: Record<string, string> = {
  pending:            "bg-amber-500/15 text-amber-400 border-amber-500/20",
  paid:               "bg-green-500/15 text-green-400 border-green-500/20",
  payment_failed:     "bg-red-500/15 text-red-400 border-red-500/20",
  cancelled:          "bg-white/10 text-white/50 border-white/10",
  refunded:           "bg-purple-500/15 text-purple-400 border-purple-500/20",
  partially_refunded: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

const paymentLabels: Record<string, string> = {
  pending:            "ממתין לתשלום",
  paid:               "שולם",
  payment_failed:     "תשלום נכשל",
  cancelled:          "בוטל",
  refunded:           "זוכה במלואו",
  partially_refunded: "זוכה חלקית",
};

const emailPresets: { status: string; label: string; message: string }[] = [
  { status: "pending",   label: "התקבלה ובבדיקה", message: "ההזמנה שלך התקבלה בהצלחה ונמצאת כעת בבדיקה. נעדכן אותך בקרוב לגבי המשך הטיפול." },
  { status: "confirmed", label: "ההזמנה אושרה",    message: "שמחים לעדכן שההזמנה שלך אושרה ואנחנו מתחילים בהכנתה." },
  { status: "shipped",   label: "יצא למשלוח",       message: "המשלוח שלך יצא לדרך ואמור להגיע בקרוב. תודה שבחרת ב-V-FORM NUTRITION!" },
  { status: "delivered", label: "ההזמנה נמסרה",     message: "ההזמנה שלך נמסרה בהצלחה. מקווים שתיהנו מהמוצרים — נשמח לשמוע פידבק!" },
  { status: "cancelled", label: "ההזמנה בוטלה",     message: "ההזמנה שלך בוטלה. אם יש לך שאלות או שהביטול לא היה מתוכנן, נשמח שתיצור/י איתנו קשר." },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customerModal, setCustomerModal] = useState<{ email: string; name: string; phone: string | null } | null>(null);
  const [emailModal, setEmailModal] = useState<{ id: string; email: string; name: string } | null>(null);
  const [emailText, setEmailText] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadOrders = async () => {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []);

  // Orders now go through a service-role API route (anon key no longer has
  // table access — see the RLS migration), so a client-side Supabase Realtime
  // subscription can't see changes anymore. Poll instead; 15s is frequent
  // enough for an admin dashboard without hammering the API.
  useEffect(() => {
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadOrders();
  };

  const deleteOrder = async (id: string) => {
    if (!window.confirm("למחוק את ההזמנה הזו? הפעולה אינה הפיכה.")) return;
    await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    if (expandedId === id) setExpandedId(null);
    loadOrders();
  };

  const refundOrder = async (id: string) => {
    if (!window.confirm("לזכות את ההזמנה במלואה מול Tranzila? הפעולה תבצע זיכוי אמיתי.")) return;
    setRefundingId(id);
    try {
      const res = await fetch("/api/admin/refund-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, full: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "הזיכוי נכשל");
      toast.success("ההזמנה זוכתה בהצלחה");
      loadOrders();
    } catch (e: any) {
      toast.error(e.message || "הזיכוי נכשל");
    } finally {
      setRefundingId(null);
    }
  };

  const sendCustomerEmail = async () => {
    if (!emailModal || !emailText.trim()) return;
    setSendingEmail(true);
    try {
      const res = await fetch("/api/send-customer-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailModal.email, customerName: emailModal.name, message: emailText.trim(), orderId: emailModal.id }),
      });
      if (!res.ok) throw new Error();
      toast.success("ההודעה נשלחה ללקוח!");
      setEmailModal(null);
      setEmailText("");
    } catch {
      toast.error("שליחת ההודעה נכשלה");
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (q) {
        const haystack = [o.customer_name, o.customer_email, o.customer_phone, o.order_number, o.tranzila_transaction_id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (paymentFilter !== "all" && (o.payment_status ?? "pending") !== paymentFilter) return false;
      if (dateFrom && new Date(o.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(o.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
      return true;
    });
  }, [orders, search, paymentFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-white">הזמנות</h1>
        <p className="text-white/40 text-sm">{filteredOrders.length} מתוך {orders.length} הזמנות</p>
      </div>

      <div className="glass border border-white/[0.07] rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-white/30 absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, אימייל, טלפון, מספר הזמנה..."
            className="w-full bg-navy-800 border border-white/[0.08] rounded-xl pr-9 pl-3 py-2 text-sm text-white placeholder-white/25 focus:border-cyan/40 focus:outline-none"
          />
        </div>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-navy-800 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:border-cyan/40 focus:outline-none"
        >
          <option value="all">כל סטטוסי התשלום</option>
          {Object.entries(paymentLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="bg-navy-800 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:border-cyan/40 focus:outline-none" />
        <span className="text-white/30 text-xs">עד</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="bg-navy-800 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:border-cyan/40 focus:outline-none" />
      </div>

      <div className="glass border border-white/[0.07] rounded-2xl overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>אין הזמנות תואמות</p>
          </div>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase w-8"></th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase">מס&apos; הזמנה</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase">לקוח</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase hidden md:table-cell">תאריך</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase">סכום</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase">תשלום</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase">משלוח</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-white/40 uppercase w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredOrders.map((o) => {
                const orderItems: any[] = Array.isArray(o.items) ? o.items : [];
                const isExpanded = expandedId === o.id;
                const paymentStatus = o.payment_status ?? "pending";
                return (
                  <React.Fragment key={o.id}>
                    <tr
                      className="hover:bg-white/[0.02] cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : o.id)}
                    >
                      <td className="px-5 py-4">
                        <ChevronDown
                          className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-white/60 text-xs font-mono">{o.order_number ?? `#${String(o.id).slice(0, 8)}`}</span>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setCustomerModal({ email: o.customer_email, name: o.customer_name, phone: o.customer_phone ?? null })}
                          className="text-right group"
                        >
                          <p className="font-semibold text-white text-sm group-hover:text-cyan transition-colors underline decoration-white/20 underline-offset-2 group-hover:decoration-cyan/50">{o.customer_name}</p>
                          <p className="text-white/30 text-xs">{o.customer_email}</p>
                          {o.customer_phone && <p className="text-white/30 text-xs">{o.customer_phone}</p>}
                        </button>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-white/40 text-xs">
                          {new Date(o.created_at).toLocaleDateString("he-IL")} {new Date(o.created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-white">₪{Number(o.total).toLocaleString("he-IL")}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${paymentColors[paymentStatus] ?? "bg-white/10 text-white/50 border-white/10"}`}>
                          {paymentLabels[paymentStatus] ?? paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className={`relative inline-flex items-center rounded-full border ${statusColors[o.status] ?? "bg-white/10 text-white/50 border-white/10"}`}>
                          <select
                            value={o.status}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            className="appearance-none bg-transparent pl-7 pr-3 py-1.5 rounded-full text-xs font-bold cursor-pointer outline-none"
                          >
                            {Object.entries(statusLabels).map(([v, l]) => (
                              <option key={v} value={v} className="bg-navy-800 text-white">{l}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 absolute left-2 pointer-events-none opacity-70" aria-hidden="true" />
                        </div>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {(paymentStatus === "paid" || paymentStatus === "partially_refunded") && (
                            <button
                              onClick={() => refundOrder(o.id)}
                              disabled={refundingId === o.id}
                              aria-label="זכה הזמנה"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-purple-400 hover:bg-purple-500/10 transition-all disabled:opacity-40"
                            >
                              {refundingId === o.id ? (
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => { setEmailModal({ id: o.id, email: o.customer_email, name: o.customer_name }); setEmailText(""); }}
                            aria-label="שלח הודעה ללקוח"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-cyan hover:bg-cyan/10 transition-all"
                          >
                            <Mail className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => deleteOrder(o.id)}
                            aria-label="מחק הזמנה"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-white/[0.015]">
                        <td colSpan={8} className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              {orderItems.length === 0 ? (
                                <p className="text-white/30 text-xs">אין פרטי מוצרים להזמנה זו</p>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-white/40 text-xs font-bold uppercase mb-2">מוצרים בהזמנה</p>
                                  {orderItems.map((it, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm bg-white/[0.03] rounded-lg px-3 py-2">
                                      <span className="text-white/80">{it.name ?? it.product_id ?? "—"}</span>
                                      <span className="text-white/40 text-xs">כמות: {it.quantity ?? 1}</span>
                                      <span className="text-white font-semibold">₪{Number(it.price ?? 0).toLocaleString("he-IL")}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-white/40 text-xs mt-3">כתובת: {o.address ?? "—"}{o.city ? `, ${o.city}` : ""}{o.zip ? ` (${o.zip})` : ""}</p>
                              {o.notes && <p className="text-white/40 text-xs mt-1">הערות: {o.notes}</p>}
                            </div>
                            <div className="bg-white/[0.03] rounded-lg p-3 space-y-1.5">
                              <p className="text-white/40 text-xs font-bold uppercase mb-1 flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5" aria-hidden="true" /> פרטי תשלום
                              </p>
                              <p className="text-white/60 text-xs">מזהה עסקת Tranzila: <span className="font-mono">{o.tranzila_transaction_id ?? "—"}</span></p>
                              <p className="text-white/60 text-xs">מספר אישור: <span className="font-mono">{o.tranzila_confirmation_code ?? "—"}</span></p>
                              <p className="text-white/60 text-xs">אמצעי תשלום: {o.payment_method_brand ?? "—"} {o.card_last4 ? `•••• ${o.card_last4}` : ""}</p>
                              <p className="text-white/60 text-xs">סביבה: {o.payment_env ?? "—"}</p>
                              {o.paid_at && <p className="text-white/60 text-xs">שולם ב: {new Date(o.paid_at).toLocaleString("he-IL")}</p>}
                              {o.last_payment_error && <p className="text-red-400 text-xs">שגיאה אחרונה: {o.last_payment_error}</p>}
                              {Number(o.refunded_amount ?? 0) > 0 && <p className="text-purple-400 text-xs">זוכה: ₪{Number(o.refunded_amount).toLocaleString("he-IL")}</p>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {customerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCustomerModal(null)}
        >
          <div
            className="bg-navy-900 border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-cyan" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-black text-white">{customerModal.name}</p>
                  <p className="text-white/40 text-xs flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3" aria-hidden="true" />{customerModal.email}
                  </p>
                  {customerModal.phone && (
                    <p className="text-white/40 text-xs flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3" aria-hidden="true" />{customerModal.phone}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setCustomerModal(null)}
                aria-label="סגור"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-white/[0.04]">
              {(() => {
                const custOrders = orders.filter((o) => o.customer_email === customerModal.email);
                return custOrders.length === 0 ? (
                  <div className="text-center py-10 text-white/30">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" aria-hidden="true" />
                    <p className="text-sm">אין הזמנות</p>
                  </div>
                ) : custOrders.map((o) => {
                  const custItems: any[] = Array.isArray(o.items) ? o.items : [];
                  return (
                    <div key={o.id} className="px-6 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-white/70 text-xs">{new Date(o.created_at).toLocaleDateString("he-IL")}</p>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[o.status] ?? "bg-white/10 text-white/50 border-white/10"}`}>
                            {statusLabels[o.status] ?? o.status}
                          </span>
                          <span className="font-black text-white text-sm">₪{Number(o.total).toLocaleString("he-IL")}</span>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {custItems.length === 0 ? (
                          <p className="text-white/30 text-xs">אין פרטי מוצרים</p>
                        ) : custItems.map((it, idx) => (
                          <p key={idx} className="text-white/60 text-xs">
                            {it.name ?? it.product_id ?? "—"} <span className="text-white/30">× {it.quantity ?? 1}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="px-6 py-3 border-t border-white/[0.06] shrink-0">
              <p className="text-white/30 text-xs">
                סה&quot;כ {orders.filter((o) => o.customer_email === customerModal.email).length} הזמנות
              </p>
            </div>
          </div>
        </div>
      )}

      {emailModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !sendingEmail && setEmailModal(null)}
        >
          <div
            className="bg-navy-900 border border-white/[0.08] rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-cyan" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-black text-white">שליחת הודעה ללקוח</p>
                  <p className="text-white/40 text-xs mt-0.5">{emailModal.name} · {emailModal.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEmailModal(null)}
                aria-label="סגור"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-white/30 text-xs font-bold uppercase">תבניות מהירות</p>
              <div className="flex flex-wrap gap-2">
                {emailPresets.map((p) => (
                  <button
                    key={p.status}
                    onClick={() => setEmailText(p.message)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                      emailText === p.message
                        ? statusColors[p.status]
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <textarea
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                rows={5}
                placeholder="כתוב כאן את ההודעה ללקוח..."
                className="w-full bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-cyan/40 resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-2">
              <button
                onClick={() => setEmailModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white/50 hover:text-white transition-all"
              >
                ביטול
              </button>
              <button
                onClick={sendCustomerEmail}
                disabled={sendingEmail || !emailText.trim()}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black px-5 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sendingEmail ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" aria-hidden="true" />
                )}
                שלח
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
