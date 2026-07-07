import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: {
    default: "V-FORM NUTRITION — הדלק לחיים שלך",
    template: "%s | V-FORM NUTRITION",
  },
  description:
    "קריאטין מונוהידראט איכותי לספורטאים ומתאמנים. אבקה בשלושה טעמים וטבליות לעיסה. ייצור לפי תקני GMP, HACCP ו-ISO.",
  keywords: ["קריאטין", "תוספי תזונה", "ספורט", "כושר", "VFORM", "creatine"],
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "V-FORM NUTRITION",
  },
  robots: { index: true, follow: true },
  metadataBase: new URL("https://www.vform-nutrition.com"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B1929",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-navy-950 text-white font-sans antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <CartDrawer />
        <CookieConsent />
        <Script
          src="https://cdn.enable.co.il/licenses/enable-L39938vi6kreahtn-0325-82744/init.js"
          strategy="afterInteractive"
        />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#0F2238",
              color: "#fff",
              border: "1px solid rgba(0,212,255,0.2)",
              fontFamily: "Heebo, sans-serif",
              direction: "rtl",
            },
          }}
        />
      </body>
    </html>
  );
}
