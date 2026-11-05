"use client";
import { supabase } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

import { LayoutDashboard, Package, Tag, ShoppingBag, MessageSquare, LogOut, Menu, Users, Bell, ExternalLink, X } from "lucide-react";



const navItems = [
  { href: "/admin", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/admin/products", label: "מוצרים", icon: Package },
  { href: "/admin/categories", label: "קטגוריות", icon: Tag },
  { href: "/admin/orders", label: "הזמנות", icon: ShoppingBag },
  { href: "/admin/customers", label: "לקוחות", icon: Users },
  { href: "/admin/contacts", label: "פניות", icon: MessageSquare },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadOrders, setUnreadOrders] = useState(0);

  useEffect(() => {
    if (pathname === "/admin/login") { setLoading(false); return; }
    const check = async () => {
      const res = await fetch("/api/admin-auth");
      if (!res.ok) { router.push("/admin/login"); return; }
      setLoading(false);
    };
    check();
  }, [router, pathname]);

  useEffect(() => {
    if (pathname === "/admin/orders") setUnreadOrders(0);
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/admin/login" || pathname === "/admin/orders") return;
    const channel = supabase
      .channel("admin-shell-order-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        toast.success(`הזמנה חדשה מ־${(payload.new as any).customer_name ?? "לקוח"}!`);
        setUnreadOrders((n) => n + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/admin-auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  const current = navItems.find((n) => n.href === pathname) ?? navItems.find((n) => n.href !== "/admin" && pathname?.startsWith(n.href));

  // Login screen: no sidebar, no logout — just the page.
  if (pathname === "/admin/login") return <div className="admin-ui min-h-screen bg-slate-100 text-slate-900" dir="rtl">{children}</div>;

  if (loading) return <div className="admin-ui min-h-screen bg-slate-100 flex items-center justify-center"><div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" role="status" aria-label="טוען" /></div>;

  return (
    <div className="admin-ui min-h-screen bg-slate-100 text-slate-900 flex" dir="rtl">
      {menuOpen && <div className="fixed inset-0 bg-slate-900/40 z-30 md:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
      <aside id="admin-sidebar" aria-label="תפריט ניהול" className={`fixed top-0 right-0 h-full w-64 bg-[#0B1929] z-40 flex flex-col transition-transform duration-300 ${menuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2.5" aria-label="לוח בקרה">
            <img src="/logo.png" alt="V-FORM NUTRITION" className="h-7 w-auto object-contain" />
            <span className="text-[11px] font-semibold tracking-wider text-white/60 border border-white/15 rounded px-1.5 py-0.5">ניהול</span>
          </Link>
          <button className="md:hidden text-white/70 hover:text-white p-2 rounded-lg" onClick={() => setMenuOpen(false)} aria-label="סגירת תפריט"><X className="w-5 h-5" aria-hidden="true" /></button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = current?.href === href;
            return (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-3 h-10 px-3 rounded-[10px] text-[15px] transition-colors ${active ? "bg-white/[0.12] text-white font-semibold" : "text-white/70 font-medium hover:text-white hover:bg-white/[0.06]"}`}>
                <Icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />{label}
                {href === "/admin/orders" && unreadOrders > 0 && (
                  <span className="mr-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">{unreadOrders > 9 ? "9+" : unreadOrders}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 h-10 px-3 rounded-[10px] text-[15px] font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors">
            <ExternalLink className="w-[18px] h-[18px]" aria-hidden="true" />צפייה באתר
          </a>
          <button onClick={handleLogout} className="flex items-center gap-3 h-10 px-3 rounded-[10px] text-[15px] font-medium hover:bg-white/[0.06] transition-colors w-full">
            <LogOut className="w-[18px] h-[18px] text-red-400" aria-hidden="true" /><span className="text-red-400">התנתקות מאובטחת</span>
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 md:mr-64 flex flex-col min-h-screen">
        <header className="admin-topbar sticky top-0 z-20 px-4 md:px-8 h-16 flex items-center gap-3">
          <button className="md:hidden p-2 -mr-2 rounded-lg text-slate-700 hover:bg-slate-100" onClick={() => setMenuOpen(true)} aria-label="פתיחת תפריט" aria-controls="admin-sidebar" aria-expanded={menuOpen}><Menu className="w-5 h-5" aria-hidden="true" /></button>
          <p className="text-[17px] font-semibold tracking-tight text-slate-900 truncate">{current?.label ?? "ניהול"}</p>
          <div className="mr-auto flex items-center gap-1">
            <Link href="/admin/orders" aria-label={unreadOrders > 0 ? `${unreadOrders} הזמנות חדשות` : "הזמנות"} className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" aria-hidden="true" />
              {unreadOrders > 0 && (
                <span className="absolute top-1.5 left-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {unreadOrders > 9 ? "9+" : unreadOrders}
                </span>
              )}
            </Link>
            <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium text-slate-700 hover:text-teal-700 hover:bg-slate-100 transition-colors">
              <ExternalLink className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline">צפייה באתר</span>
            </a>
          </div>
        </header>
        <div className="flex-1 min-w-0 p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
