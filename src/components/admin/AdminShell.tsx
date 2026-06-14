"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { LayoutDashboard, Package, Tag, ShoppingBag, MessageSquare, LogOut, Menu, Zap, Users } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const navItems = [
  { href: "/admin", label: "דשבורד", icon: LayoutDashboard },
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

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/admin/login"); return; }
      const { data, error } = await supabase.from("admin_users").select("id").eq("id", session.user.id).single();
      console.log("admin check:", { data, error, userId: session.user.id });
      if (!data) { router.push("/admin/login"); return; }
      setLoading(false);
    };
    check();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/admin/login"); };

  if (loading) return <div className="min-h-screen bg-navy-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-navy-950 flex">
      {menuOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMenuOpen(false)} />}
      <aside className={`fixed top-0 right-0 h-full w-64 bg-navy-900 border-l border-white/[0.06] z-40 flex flex-col transition-transform duration-300 ${menuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}>
        <div className="p-5 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan flex items-center justify-center"><Zap className="w-4 h-4 text-navy-900 fill-navy-900" /></div>
            <span className="font-black text-lg"><span className="text-cyan">VI</span><span className="text-white">TA</span><span className="text-white/30 text-xs mr-1">ADMIN</span></span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${pathname === href ? "bg-cyan/10 text-cyan border border-cyan/20" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/[0.06]">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all w-full">
            <LogOut className="w-4 h-4" />התנתק
          </button>
        </div>
      </aside>
      <div className="flex-1 md:mr-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-navy-900/80 backdrop-blur border-b border-white/[0.06] px-6 h-14 flex items-center justify-between">
          <button className="md:hidden" onClick={() => setMenuOpen(true)}><Menu className="w-5 h-5 text-white" /></button>
          <h1 className="text-sm font-bold text-white/60">{navItems.find(n => n.href === pathname)?.label ?? "Admin"}</h1>
          <Link href="/" className="text-xs text-cyan hover:underline">← לאתר</Link>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
