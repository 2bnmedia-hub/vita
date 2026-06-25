"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Loader2, CheckCircle } from "lucide-react";
import { useCartStore, selectTotal } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const total = useCartStore(selectTotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });

  const field =
    "w-full bg-navy-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:border-cyan/40 focus:outline-none focus:ring-2 focus:ring-cyan/10 transition-all";

  if (items.length === 0 && !done) {
    return (
      <div className="min-h-screen bg-navy-950 pt-28 flex flex-col items-center justify-center gap-6 text-center px-4">
        <ShoppingBag className="w-16 h-16 text-white/20" />
        <h1 className="text-2xl font-black">הסל שלך ריק</h1>
        <p className="text-white/40">הוסף מוצרים לסל לפני המעבר לתשלום</p>
        <Link href="/shop" className="btn-primary bg-cyan text-navy-900 font-black px-8 py-3 rounded-xl hover:bg-cyan-600 transition-colors">
          לחנות
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-navy-950 pt-28 flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-cyan/10 border border-cyan/30 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-cyan" />
        </div>
        <h1 className="text-3xl font-black">ההזמנה התקבלה!</h1>
        <p className="text-white/50 max-w-sm">תודה על הרכישה. נשלח אליך אישור במייל בהקדם.</p>
        <Link href="/shop" className="btn-primary bg-cyan text-navy-900 font-black px-8 py-3 rounded-xl hover:bg-cyan-600 transition-colors">
          חזרה לחנות
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    try {
      const orderItems = items.map((i) => ({
        product_id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
      }));

      const { error } = await supabase.from("orders").insert([
        {
          customer_name: form.name.trim(),
          customer_email: form.email.trim(),
          customer_phone: form.phone.trim() || null,
          address: `${form.address.trim()}, ${form.city.trim()}`,
          notes: form.notes.trim() || null,
          items: orderItems,
          total,
          status: "pending",
        },
      ]);

      if (error) throw error;

      clearCart();
      setDone(true);
      toast.success("ההזמנה נשלחה בהצלחה!");
    } catch {
      toast.error("אירעה שגיאה. נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 pt-24" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-white/30 mb-8">
          <Link href="/" className="hover:text-white transition-colors">בית</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-white transition-colors">חנות</Link>
          <span>/</span>
          <span className="text-white/60">תשלום</span>
        </nav>

        <h1 className="text-3xl font-black mb-8">סיום הזמנה</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
            <div className="glass border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-white/80 text-sm uppercase tracking-wider mb-2">פרטי משלוח</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider">שם מלא *</label>
                  <input required type="text" placeholder="ישראל ישראלי"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={field} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider">אימייל *</label>
                  <input required type="email" placeholder="israel@example.com"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={field} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50 text-xs font-bold uppercase tracking-wider">טלפון *</label>
                <input required type="tel" placeholder="05X-XXX-XXXX"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={field} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider">כתובת *</label>
                  <input required type="text" placeholder="רחוב, מספר בית, דירה"
                    value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className={field} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider">עיר *</label>
                  <input required type="text" placeholder="תל אביב"
                    value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className={field} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50 text-xs font-bold uppercase tracking-wider">הערות (אופציונלי)</label>
                <textarea rows={3} placeholder="הערות מיוחדות להזמנה..."
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={`${field} resize-none`} />
              </div>
            </div>

            {/* Payment notice */}
            <div className="glass border border-cyan/20 rounded-2xl p-5 flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan text-sm">₪</span>
              </div>
              <div>
                <p className="font-bold text-sm text-white/80">תשלום בעת האספקה</p>
                <p className="text-white/40 text-xs mt-0.5">ניצור אתך קשר לאישור ההזמנה ותיאום תשלום.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary bg-cyan text-navy-900 font-black py-4 rounded-xl text-base hover:bg-cyan-600 transition-colors shadow-cyan disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />שולח הזמנה...</>
              ) : (
                <>אישור הזמנה — {formatPrice(total)}<ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          {/* Order summary */}
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
                  <span>משלוח</span>
                  <span className="text-green-400 font-bold">חינם</span>
                </div>
                <div className="flex justify-between font-black text-lg">
                  <span>סה&quot;כ</span>
                  <span className="text-white">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
