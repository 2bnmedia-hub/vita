"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Menu, X, Zap, User, LogOut, Settings } from "lucide-react";
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
    <header className={cn(
      "fixed top-0 inset-x-0 z-50 transition-all duration-300",
      scrolled ? "glass border-b border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)]" : "bg-transparent"
    )}>
      <nav className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-cyan flex items-center justify-center shadow-cyan-sm">
            <Zap className="w-5 h-5 text-navy-900 fill-navy-900" />
          </div>
          <span className="font-black text-2xl tracking-tight">
            <span className="text-cyan">VI</span>
            <span className="text-white">TA</span>
            <span className="text-white/30 text-sm font-medium ms-2 tracking-normal">NUTRITION</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-10">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="nav-link text-white/70 hover:text-white text-base font-semibold tracking-wide transition-colors duration-200"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link href="/admin/login"
            className="hidden md:flex w-9 h-9 rounded-xl glass flex items-center justify-center hover:border-cyan/20 transition-all duration-200 opacity-30 hover:opacity-70"
            aria-label="כניסת מנהל"
            title="כניסת מנהל">
            <Settings className="w-4 h-4 text-white/60" />
          </Link>

          <button
            onClick={openCart}
            className="relative w-11 h-11 rounded-xl glass-cyan flex items-center justify-center hover:border-cyan/40 transition-all duration-200"
            aria-label="סל קניות"
          >
            <ShoppingCart className="w-5 h-5 text-cyan" />
            {itemCount > 0 && (
              <span className="cart-badge-pulse absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-cyan text-navy-900 text-[10px] font-black flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/account"
                className="flex items-center gap-2 glass border border-white/[0.08] hover:border-cyan/30 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-all">
                <User className="w-4 h-4 text-cyan" />
                האזור שלי
              </Link>
              <button onClick={handleLogout}
                className="w-10 h-10 rounded-xl glass flex items-center justify-center transition-all hover:bg-red-500/10">
                <LogOut className="w-4 h-4" style={{color: "#FF2800"}} />
              </button>
            </div>
          ) : (
            <Link href="/account/login"
              className="hidden md:flex items-center gap-2 glass border border-white/[0.08] hover:border-cyan/30 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-all">
              <User className="w-4 h-4 text-cyan" />
              כניסה
            </Link>
          )}

          <Link href="/shop"
            className="hidden">
            לחנות
          </Link>

          <button
            className="md:hidden w-11 h-11 rounded-xl glass flex items-center justify-center"
            onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-white/[0.06] px-6 py-5 flex flex-col gap-4">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="text-white/80 hover:text-white font-semibold text-base py-2 border-b border-white/[0.06] last:border-0 tracking-wide">
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/account" onClick={() => setMenuOpen(false)} className="text-white/80 hover:text-white font-semibold py-2 border-b border-white/[0.06]">האזור שלי</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="text-red-400 font-semibold py-2 text-right">התנתק</button>
            </>
          ) : (
            <Link href="/account/login" onClick={() => setMenuOpen(false)} className="text-white/80 hover:text-white font-semibold py-2 border-b border-white/[0.06]">כניסה / הרשמה</Link>
          )}
          <Link href="/shop" onClick={() => setMenuOpen(false)}
            className="btn-primary bg-cyan text-navy-900 font-black text-sm px-5 py-3 rounded-xl text-center mt-1 tracking-wide">
            לחנות
          </Link>
        </div>
      )}
    </header>
  );
}
