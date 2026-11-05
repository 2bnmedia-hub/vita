import type { Metadata } from "next";
import "../globals.css";
import { Toaster } from "react-hot-toast";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "V-FORM Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      {children}
      <Toaster position="bottom-center" toastOptions={{
        style: { background: "#fff", color: "#0f172a", border: "1px solid #e2e8f0", fontFamily: "Heebo, sans-serif", direction: "rtl", fontSize: 15 },
        success: { iconTheme: { primary: "#0f766e", secondary: "#fff" } },
        error: { iconTheme: { primary: "#b91c1c", secondary: "#fff" } },
      }} />
    </AdminShell>
  );
}
