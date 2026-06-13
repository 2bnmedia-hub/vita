import type { Metadata } from "next";
import "../globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "האזור האישי | VITA",
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{direction: "rtl"}}>
      {children}
      <Toaster position="bottom-center" toastOptions={{
        style: { background: "#0F2238", color: "#fff", border: "1px solid rgba(0,212,255,0.2)", fontFamily: "Heebo, sans-serif", direction: "rtl" },
        success: { iconTheme: { primary: "#00D4FF", secondary: "#0B1929" } },
        error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
      }} />
    </div>
  );
}
