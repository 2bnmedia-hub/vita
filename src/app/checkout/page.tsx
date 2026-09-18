"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Loader2, CheckCircle, XCircle, Lock } from "lucide-react";
import { useCartStore, selectTotal, SHIPPING_COST, SHIPPING_LABEL } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

declare global {
  interface Window {
    TzlaHostedFields?: {
      create: (config: any) => any;
    };
  }
}

type Phase = "form" | "paying" | "success" | "failure";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore(selectTotal);
  const region = useCartStore((s) => s.shippingRegion);
  const setRegion = useCartStore((s) => s.setShippingRegion);
  const shipping = SHIPPING_COST[region];
  const grandTotal = total + shipping;
  const clearCart = useCartStore((s) => s.clearCart);

  const [phase, setPhase] = useState<Phase>("form");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [fieldsReady, setFieldsReady] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    notes: "",
    agreedToTerms: false,
  });

  // One idempotency key per checkout attempt — reused across retries so a
  // double-submit / refresh / network retry can never create two orders.
  const idempotencyKeyRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
  );
  const hostedFieldsRef = useRef<any>(null);

  const field =
    "w-full bg-navy-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:border-cyan/40 focus:outline-none focus:ring-2 focus:ring-cyan/10 transition-all";

  const cardFieldBox =
    "bg-navy-800 border border-white/[0.08] rounded-xl px-4 h-[46px] focus-within:border-cyan/40 focus-within:ring-2 focus-within:ring-cyan/10 transition-all";

  useEffect(() => {
    if (!scriptReady || fieldsReady) return;
    if (!window.TzlaHostedFields) return;
    try {
      hostedFieldsRef.current = window.TzlaHostedFields.create({
        sandbox: false,
        fields: {
          credit_card_number: { selector: "#tz-card-number", placeholder: "0000 0000 0000 0000" },
          cvv: { selector: "#tz-cvv", placeholder: "CVV" },
          expiry: { selector: "#tz-expiry", placeholder: "MM/YY" },
        },
        styles: {
          input: { "font-size": "14px", color: "#ffffff", "font-family": "inherit" },
          "::placeholder": { color: "rgba(255,255,255,0.25)" },
        },
      });
      setFieldsReady(true);
    } catch {
      // Will surface as "payment form unavailable" if the user tries to submit.
    }
  }, [scriptReady, fieldsReady]);

  if (items.length === 0 && phase === "form") {
    return (
      <div className="min-h-screen bg-navy-950 pt-28 flex flex-col items-center justify-center gap-6 text-center px-4">
        <ShoppingBag className="w-16 h-16 text-white/20" aria-hidden="true" />
        <h1 className="text-2xl font-black">הסל שלך ריק</h1>
        <p className="text-white/40">הוסף מוצרים לסל לפני המעבר לתשלום</p>
        <Link href="/shop" className="btn-primary bg-cyan text-navy-900 font-black px-8 py-3 rounded-xl hover:bg-cyan-600 transition-colors">
          לחנות
        </Link>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="min-h-screen bg-navy-950 pt-28 flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-cyan/10 border border-cyan/30 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-cyan" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-black">התשלום אושר בהצלחה!</h1>
        {orderNumber && <p className="text-white/60">מספר הזמנה: <span className="font-bold text-cyan">{orderNumber}</span></p>}
        <p className="text-white/50 max-w-sm">תודה על הרכישה. נשלח אליך אישור במייל בהקדם.</p>
        <Link href="/shop" className="btn-primary bg-cyan text-navy-900 font-black px-8 py-3 rounded-xl hover:bg-cyan-600 transition-colors">
          חזרה לחנות
        </Link>
      </div>
    );
  }

  if (phase === "failure") {
    return (
      <div className="min-h-screen bg-navy-950 pt-28 flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-400" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-black">התשלום נכשל</h1>
        <p className="text-white/50 max-w-sm">{errorMsg ?? "אירעה שגיאה בביצוע התשלום."}</p>
        <button
          onClick={() => setPhase("form")}
          className="btn-primary bg-cyan text-navy-900 font-black px-8 py-3 rounded-xl hover:bg-cyan-600 transition-colors"
        >
          נסה/י שוב
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || items.length === 0) return;
    if (!fieldsReady || !hostedFieldsRef.current) {
      toast.error("טופס התשלום עדיין נטען, נסה/י שוב בעוד רגע.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setPhase("paying");

    try {
      const createRes = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
          customer: form,
          shippingRegion: region,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });
      const createData = await createRes.json();

      if (!createRes.ok) {
        setErrorMsg(createData.error || "יצירת ההזמנה נכשלה.");
        setPhase("failure");
        setSubmitting(false);
        return;
      }

      const { orderId, orderNumber: newOrderNumber, amount, thtk } = createData;

      hostedFieldsRef.current.charge(
        { terminal_name: createData.terminalName, amount: Number(amount).toFixed(2), thtk },
        async (err: any, response: any) => {
          if (err) {
            // TzlaHostedFields' `err` callback fires for SDK/field-validation
            // failures (see err.messages), not for real card declines from
            // the issuer — those come back as a successful callback with a
            // failing status and are handled below via /api/checkout/verify.
            // Nothing here has ever reached our server before, so report it.
            const fieldErrors = Array.isArray(err?.messages)
              ? err.messages.map((m: any) => `${m?.param}:${m?.message}`).join("; ")
              : null;
            const detail = (fieldErrors || err?.message || JSON.stringify(err) || "").slice(0, 300);
            const kind = fieldErrors ? "config_error" : "provider_error";

            fetch("/api/checkout/report-client-error", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId, stage: "hosted_fields_charge", kind, detail }),
            }).catch(() => {});

            setErrorMsg(
              fieldErrors
                ? "שגיאה בטופס התשלום. נסה/י לרענן את העמוד ולנסות שוב, או פנה/י אלינו."
                : "שגיאה בתקשורת מול ספק הסליקה. נסה/י שוב בעוד רגע."
            );
            setPhase("failure");
            setSubmitting(false);
            return;
          }

          const txResult = response?.transaction_response ?? response?.transaction_result ?? response ?? {};
          const transactionId = String(
            txResult.transaction_id ?? txResult.index ?? response?.transaction_id ?? ""
          );

          if (!transactionId) {
            setErrorMsg("לא התקבל אישור עסקה. נסה/י שוב.");
            setPhase("failure");
            setSubmitting(false);
            return;
          }

          // TzlaHostedFields reports card declines through this SAME success callback
          // (transaction_response.success: false + processor_response_code), not via
          // `err`. We forward the code so /verify can show the real decline reason
          // instead of a generic message when its own Tranzila lookup finds nothing —
          // it's never used to decide success, only to explain a failure.
          const processorCode =
            txResult.processor_response_code != null ? String(txResult.processor_response_code).slice(0, 10) : null;

          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              transactionId,
              cardBrand: txResult.card_type_name,
              last4: txResult.credit_card_last_4_digits,
              installments: txResult.total_installments_number,
              processorCode,
            }),
          });
          const verifyData = await verifyRes.json();

          setSubmitting(false);
          if (verifyData.ok) {
            clearCart();
            setOrderNumber(newOrderNumber);
            setPhase("success");
          } else {
            setErrorMsg(verifyData.message || "אירעה שגיאה באישור התשלום.");
            setPhase("failure");
          }
        }
      );
    } catch {
      setErrorMsg("שגיאת רשת. נסה/י שוב.");
      setPhase("failure");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 pt-24" dir="rtl">
      <Script src="https://hf.tranzila.com/assets/js/thostedf.js" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <nav className="flex items-center gap-2 text-sm text-white/30 mb-8">
          <Link href="/" className="hover:text-white transition-colors">בית</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-white transition-colors">חנות</Link>
          <span>/</span>
          <span className="text-white/60">תשלום</span>
        </nav>

        <h1 className="text-3xl font-black mb-8">סיום הזמנה</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
            <div className="glass border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-white/80 text-sm uppercase tracking-wider mb-2">פרטי משלוח</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="checkout-name" className="text-white/50 text-xs font-bold uppercase tracking-wider">שם מלא *</label>
                  <input id="checkout-name" required type="text" autoComplete="name" placeholder="ישראל ישראלי"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={field} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="checkout-email" className="text-white/50 text-xs font-bold uppercase tracking-wider">אימייל *</label>
                  <input id="checkout-email" required type="email" autoComplete="email" placeholder="israel@example.com"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={field} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="checkout-phone" className="text-white/50 text-xs font-bold uppercase tracking-wider">טלפון *</label>
                <input id="checkout-phone" required type="tel" autoComplete="tel" placeholder="05X-XXX-XXXX"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={field} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="checkout-address" className="text-white/50 text-xs font-bold uppercase tracking-wider">כתובת *</label>
                  <input id="checkout-address" required type="text" autoComplete="street-address" placeholder="רחוב, מספר בית, דירה"
                    value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className={field} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="checkout-city" className="text-white/50 text-xs font-bold uppercase tracking-wider">עיר *</label>
                  <input id="checkout-city" required type="text" autoComplete="address-level2" placeholder="תל אביב"
                    value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className={field} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="checkout-zip" className="text-white/50 text-xs font-bold uppercase tracking-wider">מיקוד</label>
                  <input id="checkout-zip" type="text" inputMode="numeric" autoComplete="postal-code" placeholder="1234567"
                    value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })}
                    className={field} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="checkout-notes" className="text-white/50 text-xs font-bold uppercase tracking-wider">הערות (אופציונלי)</label>
                <textarea id="checkout-notes" rows={3} placeholder="הערות מיוחדות להזמנה..."
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={`${field} resize-none`} />
              </div>
            </div>

            <div className="glass border border-white/[0.08] rounded-2xl p-6 space-y-3">
              <h2 className="font-bold text-white/80 text-sm uppercase tracking-wider mb-1" id="shipping-region-label">אזור משלוח *</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup" aria-labelledby="shipping-region-label">
                {(["north", "center", "south", "pickup"] as const).map((r) => (
                  <label
                    key={r}
                    className={`rounded-xl px-4 py-3 text-sm font-bold border transition-all block text-center cursor-pointer focus-within:ring-2 focus-within:ring-cyan focus-within:ring-offset-2 focus-within:ring-offset-navy-900 ${
                      region === r
                        ? "bg-cyan/10 border-cyan/40 text-cyan"
                        : "bg-navy-800 border-white/[0.08] text-white/60 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingRegion"
                      value={r}
                      checked={region === r}
                      onChange={() => setRegion(r)}
                      className="sr-only"
                    />
                    {SHIPPING_LABEL[r]}
                    <span className="block text-xs font-normal mt-0.5 text-white/40">{formatPrice(SHIPPING_COST[r])}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="glass border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-white/80 text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-cyan" aria-hidden="true" />
                פרטי תשלום
              </h2>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider">מספר כרטיס *</label>
                  <div id="tz-card-number" className={cardFieldBox} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-white/50 text-xs font-bold uppercase tracking-wider">תוקף (MM/YY) *</label>
                    <div id="tz-expiry" className={cardFieldBox} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-white/50 text-xs font-bold uppercase tracking-wider">CVV *</label>
                    <div id="tz-cvv" className={cardFieldBox} />
                  </div>
                </div>
              </div>
              {!fieldsReady && (
                <p className="text-white/30 text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  טוען טופס תשלום מאובטח...
                </p>
              )}
              <p className="text-white/30 text-xs">פרטי הכרטיס מוצפנים ומועברים ישירות ל-Tranzila. האתר אינו שומר או רואה את פרטי הכרטיס שלך.</p>
            </div>

            <label className="glass border border-white/[0.08] rounded-2xl p-5 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={form.agreedToTerms}
                onChange={(e) => setForm({ ...form, agreedToTerms: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-cyan"
              />
              <span className="text-sm text-white/70">
                קראתי ואני מסכים/ה ל
                <Link href="/returns" className="text-cyan hover:underline mx-1">תנאי הרכישה וההחזרות</Link>
                *
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !form.agreedToTerms}
              className="w-full btn-primary bg-cyan text-navy-900 font-black py-4 rounded-xl text-base hover:bg-cyan-600 transition-colors shadow-cyan disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />מבצע תשלום...</>
              ) : (
                <>תשלום מאובטח — {formatPrice(grandTotal)}<ArrowRight className="w-5 h-5" aria-hidden="true" /></>
              )}
            </button>
          </form>

          <div className="lg:col-span-2">
            <div className="glass border border-white/[0.08] rounded-2xl p-5 sticky top-28">
              <h2 className="font-bold text-sm text-white/60 uppercase tracking-wider mb-4">סיכום הזמנה</h2>
              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-navy-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src={item.product.images?.[0] || "/creatine-hero.png"}
                        alt={item.product.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/creatine-hero.png"; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug line-clamp-1">{item.product.name}</p>
                      <p className="text-white/40 text-xs">כמות: {item.quantity}</p>
                    </div>
                    <p className="text-cyan font-bold text-sm shrink-0">{formatPrice(item.product.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[0.06] pt-4 space-y-2">
                <div className="flex justify-between text-sm text-white/50">
                  <span>סכום ביניים</span>
                  <span className="text-white/70">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-white/50">
                  <span>משלוח ({SHIPPING_LABEL[region]})</span>
                  <span className="text-white/70">{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between font-black text-lg pt-1">
                  <span>סה&quot;כ</span>
                  <span className="text-white">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
