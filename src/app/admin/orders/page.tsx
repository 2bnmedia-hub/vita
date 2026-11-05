"use client";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, ChevronDown, Trash2, X, Mail, Phone, User, Clock, Send, Search, CreditCard, RotateCcw, Banknote } from "lucide-react";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-teal-50 text-teal-800 border-teal-200",
  shipped:   "bg-blue-50 text-blue-800 border-blue-200",
  delivered: "bg-green-50 text-green-800 border-green-200",
  cancelled: "bg-red-50 text-red-800 border-red-200",
};

const statusLabels: Record<string, string> = {
  pending:   "ממתין",
  confirmed: "אושר",
  shipped:   "נשלח",
  delivered: "נמסר",
  cancelled: "בוטל",
};

const paymentColors: Record<string, string> = {
  pending:            "bg-amber-50 text-amber-800 border-amber-200",
  cod_pending:        "bg-orange-50 text-orange-800 border-orange-200",
  paid:               "bg-green-50 text-green-800 border-green-200",
  payment_failed:     "bg-red-50 text-red-800 border-red-200",
  cancelled:          "bg-slate-100 text-slate-700 border-slate-200",
  refunded:           "bg-purple-50 text-purple-800 border-purple-200",
  partially_refunded: "bg-purple-50 text-purple-800 border-purple-200",
};

const paymentLabels: Record<string, string> = {
  pending:            "ממתין לתשלום",
  cod_pending:        "ממתין לתשלום לשליח",
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
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

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
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) toast.error((await res.json().catch(() => ({}))).error || "עדכון הסטטוס נכשל");
    loadOrders();
  };

  const markCodPaid = async (o: any) => {
    if (!window.confirm(`לאשר שהתקבל תשלום של ₪${Number(o.total).toLocaleString("he-IL")} מהשליח עבור הזמנה ${o.order_number ?? ""}?`)) return;
    setMarkingPaidId(o.id);
    try {
      const res = await fetch("/api/admin/mark-cod-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: o.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "עדכון התשלום נכשל");
      toast.success("התשלום סומן כהתקבל");
      loadOrders();
    } catch (e: any) {
      toast.error(e.message || "עדכון התשלום נכשל");
    } finally {
      setMarkingPaidId(null);
    }
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
        <h1 className="text-2xl font-black text-slate-900">הזמנות</h1>
        <p className="text-slate-600 text-sm">{filteredOrders.length} מתוך {orders.length} הזמנות</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, אימייל, טלפון, מספר הזמנה..."
            className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none"
          />
        </div>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
        >
          <option value="all">כל סטטוסי התשלום</option>
          {Object.entries(paymentLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none" />
        <span className="text-slate-500 text-xs">עד</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>אין הזמנות תואמות</p>
          </div>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase w-8"></th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase">מס&apos; הזמנה</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase">לקוח</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase hidden md:table-cell">תאריך</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase">סכום</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase">תשלום</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase">משלוח</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((o) => {
                const orderItems: any[] = Array.isArray(o.items) ? o.items : [];
                const isExpanded = expandedId === o.id;
                const paymentStatus = o.payment_status ?? "pending";
                return (
                  <React.Fragment key={o.id}>
                    <tr
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : o.id)}
                    >
                      <td className="px-5 py-4">
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-slate-700 text-xs font-mono">{o.order_number ?? `#${String(o.id).slice(0, 8)}`}</span>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setCustomerModal({ email: o.customer_email, name: o.customer_name, phone: o.customer_phone ?? null })}
                          className="text-right group"
                        >
                          <p className="font-semibold text-slate-900 text-sm group-hover:text-teal-700 transition-colors underline decoration-slate-300 underline-offset-2 group-hover:decoration-cyan/50">{o.customer_name}</p>
                          <p className="text-slate-500 text-xs">{o.customer_email}</p>
                          {o.customer_phone && <p className="text-slate-500 text-xs">{o.customer_phone}</p>}
                        </button>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-slate-600 text-xs">
                          {new Date(o.created_at).toLocaleDateString("he-IL")} {new Date(o.created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900">₪{Number(o.total).toLocaleString("he-IL")}</span>
                        {o.coupon_code && (
                          <p className="text-teal-700 text-xs mt-0.5">קופון {o.coupon_code} · ‎-₪{Number(o.discount_amount ?? 0).toLocaleString("he-IL")}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${paymentColors[paymentStatus] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {paymentLabels[paymentStatus] ?? paymentStatus}
                        </span>
                        {o.payment_method === "cod" && (
                          <p className="text-slate-600 text-xs mt-1">תשלום לשליח{paymentStatus === "cod_pending" ? ` · לגבייה ₪${Number(o.total).toLocaleString("he-IL")}` : ""}</p>
                        )}
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className={`relative inline-flex items-center rounded-full border ${statusColors[o.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          <select
                            value={o.status}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            className="appearance-none bg-transparent pl-7 pr-3 py-1.5 rounded-full text-xs font-bold cursor-pointer outline-none"
                          >
                            {Object.entries(statusLabels).map(([v, l]) => (
                              <option key={v} value={v} className="bg-white text-slate-900">{l}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 absolute left-2 pointer-events-none opacity-70" aria-hidden="true" />
                        </div>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {paymentStatus === "cod_pending" && (
                            <button
                              onClick={() => markCodPaid(o)}
                              disabled={markingPaidId === o.id}
                              aria-label="סמן שהתשלום התקבל"
                              title="סמן שהתשלום התקבל"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-green-700 hover:bg-green-50 transition-all disabled:opacity-40"
                            >
                              {markingPaidId === o.id ? (
                                <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Banknote className="w-4 h-4" aria-hidden="true" />
                              )}
                            </button>
                          )}
                          {(paymentStatus === "paid" || paymentStatus === "partially_refunded") && (
                            <button
                              onClick={() => refundOrder(o.id)}
                              disabled={refundingId === o.id}
                              aria-label="זכה הזמנה"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-40"
                            >
                              {refundingId === o.id ? (
                                <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => { setEmailModal({ id: o.id, email: o.customer_email, name: o.customer_name }); setEmailText(""); }}
                            aria-label="שלח הודעה ללקוח"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-all"
                          >
                            <Mail className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => deleteOrder(o.id)}
                            aria-label="מחק הזמנה"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-700 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={8} className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              {orderItems.length === 0 ? (
                                <p className="text-slate-500 text-xs">אין פרטי מוצרים להזמנה זו</p>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-slate-600 text-xs font-bold uppercase mb-2">מוצרים בהזמנה</p>
                                  {orderItems.map((it, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                                      <span className="text-slate-700">{it.name ?? it.product_id ?? "—"}</span>
                                      <span className="text-slate-600 text-xs">כמות: {it.quantity ?? 1}</span>
                                      <span className="text-slate-900 font-semibold">₪{Number(it.price ?? 0).toLocaleString("he-IL")}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-slate-600 text-xs mt-3">כתובת: {o.address ?? "—"}{o.city ? `, ${o.city}` : ""}{o.zip ? ` (${o.zip})` : ""}</p>
                              {o.notes && <p className="text-slate-600 text-xs mt-1">הערות: {o.notes}</p>}
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                              <p className="text-slate-600 text-xs font-bold uppercase mb-1 flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5" aria-hidden="true" /> פרטי תשלום
                              </p>
                              {o.payment_method === "cod" && (
                                <>
                                  <p className="text-slate-700 text-xs">אמצעי תשלום: <span className="font-bold text-slate-700">תשלום לשליח</span></p>
                                  <p className="text-slate-700 text-xs">סכום לגבייה בעת המסירה: ₪{Number(o.total).toLocaleString("he-IL")}</p>
                                  {o.cod_collected_at && (
                                    <p className="text-green-800 text-xs">התקבל ב: {new Date(o.cod_collected_at).toLocaleString("he-IL")} · סומן ע&quot;י {o.cod_collected_by}</p>
                                  )}
                                </>
                              )}
                              <p className="text-slate-700 text-xs">מזהה עסקת Tranzila: <span className="font-mono">{o.tranzila_transaction_id ?? "—"}</span></p>
                              <p className="text-slate-700 text-xs">מספר אישור: <span className="font-mono">{o.tranzila_confirmation_code ?? "—"}</span></p>
                              <p className="text-slate-700 text-xs">אמצעי תשלום: {o.payment_method_brand ?? "—"} {o.card_last4 ? `•••• ${o.card_last4}` : ""}</p>
                              <p className="text-slate-700 text-xs">סביבה: {o.payment_env ?? "—"}</p>
                              {o.paid_at && <p className="text-slate-700 text-xs">שולם ב: {new Date(o.paid_at).toLocaleString("he-IL")}</p>}
                              {o.last_payment_error && <p className="text-red-800 text-xs">שגיאה אחרונה: {o.last_payment_error}</p>}
                              {Number(o.refunded_amount ?? 0) > 0 && <p className="text-purple-800 text-xs">זוכה: ₪{Number(o.refunded_amount).toLocaleString("he-IL")}</p>}
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
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCustomerModal(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            style={{ boxShadow: "0 12px 32px rgba(15,23,42,0.12)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-teal-700" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-black text-slate-900">{customerModal.name}</p>
                  <p className="text-slate-600 text-xs flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3" aria-hidden="true" />{customerModal.email}
                  </p>
                  {customerModal.phone && (
                    <p className="text-slate-600 text-xs flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3" aria-hidden="true" />{customerModal.phone}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setCustomerModal(null)}
                aria-label="סגור"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-slate-100">
              {(() => {
                const custOrders = orders.filter((o) => o.customer_email === customerModal.email);
                return custOrders.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" aria-hidden="true" />
                    <p className="text-sm">אין הזמנות</p>
                  </div>
                ) : custOrders.map((o) => {
                  const custItems: any[] = Array.isArray(o.items) ? o.items : [];
                  return (
                    <div key={o.id} className="px-6 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-slate-700 text-xs">{new Date(o.created_at).toLocaleDateString("he-IL")}</p>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[o.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                            {statusLabels[o.status] ?? o.status}
                          </span>
                          <span className="font-black text-slate-900 text-sm">₪{Number(o.total).toLocaleString("he-IL")}</span>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {custItems.length === 0 ? (
                          <p className="text-slate-500 text-xs">אין פרטי מוצרים</p>
                        ) : custItems.map((it, idx) => (
                          <p key={idx} className="text-slate-700 text-xs">
                            {it.name ?? it.product_id ?? "—"} <span className="text-slate-500">× {it.quantity ?? 1}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="px-6 py-3 border-t border-slate-200 shrink-0">
              <p className="text-slate-500 text-xs">
                סה&quot;כ {orders.filter((o) => o.customer_email === customerModal.email).length} הזמנות
              </p>
            </div>
          </div>
        </div>
      )}

      {emailModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !sendingEmail && setEmailModal(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
            style={{ boxShadow: "0 12px 32px rgba(15,23,42,0.12)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-teal-700" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-black text-slate-900">שליחת הודעה ללקוח</p>
                  <p className="text-slate-600 text-xs mt-0.5">{emailModal.name} · {emailModal.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEmailModal(null)}
                aria-label="סגור"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-slate-500 text-xs font-bold uppercase">תבניות מהירות</p>
              <div className="flex flex-wrap gap-2">
                {emailPresets.map((p) => (
                  <button
                    key={p.status}
                    onClick={() => setEmailText(p.message)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                      emailText === p.message
                        ? statusColors[p.status]
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder-slate-400 outline-none focus:border-teal-600 resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setEmailModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all"
              >
                ביטול
              </button>
              <button
                onClick={sendCustomerEmail}
                disabled={sendingEmail || !emailText.trim()}
                className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-black px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sendingEmail ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
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
