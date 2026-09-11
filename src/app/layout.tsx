import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { AccessibilityWidget } from "@/components/layout/AccessibilityWidget";
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=localStorage.getItem('vform_a11y_settings');if(!r)return;var s=JSON.parse(r);var h=document.documentElement;if(s.textScale)h.style.setProperty('--a11y-text-scale',s.textScale);var f=[];if(s.grayscale)f.push('grayscale(1)');if(s.contrastHigh)f.push('contrast(1.35) saturate(1.15)');if(s.contrastDark)f.push('brightness(0.82)');if(s.invertColors)f.push('invert(1)');if(s.theme==='light')f.push('invert(1) hue-rotate(180deg)');if(f.length)h.style.filter=f.join(' ');var m={contrastHigh:'a11y-contrast-high',underlineLinks:'a11y-underline-links',highlightHeadings:'a11y-highlight-headings',lineHeight:'a11y-line-height',letterSpacing:'a11y-letter-spacing',readableFont:'a11y-readable-font',stopMotion:'a11y-stop-motion',hideImages:'a11y-hide-images',bigCursor:'a11y-big-cursor',focusStrong:'a11y-focus-strong'};for(var k in m){if(s[k])h.classList.add(m[k]);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-navy-950 text-white font-sans antialiased">
        <a href="#main-content" className="skip-link">
          דילוג לתוכן הראשי
        </a>
        <Navbar />
        <main id="main-content" className="min-h-screen">{children}</main>
        <Footer />
        <CartDrawer />
        <CookieConsent />
        <AccessibilityWidget />
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
