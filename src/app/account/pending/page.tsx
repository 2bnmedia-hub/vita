"use client";
import Link from "next/link";
import { Clock, Zap } from "lucide-react";

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-400" />
        </div>
        <h1 className="text-3xl font-black mb-3">ממתין לאישור</h1>
        <p className="text-white/50 leading-relaxed mb-8">
          תודה שנרשמת ל-VITA! החשבון שלך ממתין לאישור מנהל.
          תקבל מייל ברגע שהחשבון יאושר.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 bg-cyan text-navy-900 font-black px-6 py-3 rounded-xl hover:bg-cyan-600 transition-colors">
          <Zap className="w-4 h-4 fill-navy-900" />
          חזור לאתר
        </Link>
      </div>
    </div>
  );
}
