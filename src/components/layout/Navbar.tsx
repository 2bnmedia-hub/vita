"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Menu, X, Zap, User, LogOut } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { supabase } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "בית", href: "/" },
  { label: "חנות", href: "/shop" },
  { label: "אודות", href: "/#about" },
  { label: "צור קשר", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { itemCount, openCart } = useCartStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); };

  return (
    <header className={cn("fixed top-0 inset-x-0 z-50 transition-all duration-300", scrolled ? "glass border-b border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)]" : "bg-transparent")}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-cyan flex items-center justify-center shadow-cyan-sm">
            <Zap className="w-4 h-4 text-navy-900 fill-navy-900" />
          </div>
          <span className="font-black text-xl tracking-tight">
            <span className="text-cyan">VI</span>
            <span className="text-white">TA</span>
            <span className="text-white/40 text-sm font-medium ms-1">NUTRITION</span>
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="nav-link text-white/70 hover:text-white text-sm font-medium transition-colors duration-200">{l.label}</Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button onClick={openCart} className="relative w-10 h-10 rounded-xl glass-cyan flex items-center justify-center hover:border-cyan/40 transition-all duration-200" aria-label="סל קניות">
            <ShoppingCart className="w-5 h-5 text-cyan" />
            {itemCount > 0 && (
              <span className="cart-badge-pulse absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-cyan text-navy-900 text-[10px] font-black flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/account" className="flex items-center gap-2 glass border border-white/[0.08] hover:border-cyan/30 px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all">
                <User className="w-4 h-4 text-cyan" />
                האזור שלי
              </Link>
              <button onClick={handleLogout} className="w-9 h-9 rounded-xl glass flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/20 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/account/login" className="hidden md:flex items-center gap-2 glass border border-white/[0.08] hover:border-cyan/30 px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all">
              <User className="w-4 h-4 text-cyan" />
              כניסה
            </Link>
          )}

          <Link href="/shop" className="hidden md:block btn-primary bg-cyan text-navy-900 font-bold text-sm px-5 py-2 rounded-xl hover:bg-cyan-600 transition-colors duration-200">לחנות</Link>

          <button className="md:hidden w-10 h-10 rounded-xl glass flex items-center justify-center" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden glass border-t border-white/[0.06] px-4 py-4 flex flex-col gap-3">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-white/80 hover:text-white font-medium py-2 border-b border-white/[0.06] last:border-0">{l.label}</Link>
          ))}
          {user ? (
            <>
              <Link href="/account" onClick={() => setMenuOpen(false)} className="text-white/80 hover:text-white font-medium py-2 border-b border-white/[0.06]">האזור שלי</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="text-red-400 font-medium py-2 text-right">התנתק</button>
            </>
          ) : (
            <Link href="/account/login" onClick={() => setMenuOpen(false)} className="text-white/80 hover:text-white font-medium py-2 border-b border-white/[0.06]">כניסה / הרשמה</Link>
          )}
          <Link href="/shop" onClick={() => setMenuOpen(false)} className="btn-primary bg-cyan text-navy-900 font-bold text-sm px-5 py-2.5 rounded-xl text-center mt-2">לחנות</Link>
        </div>
      )}
    </header>
  );
}
