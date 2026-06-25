import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#020B14",
          900: "#0B1929",
          800: "#0F2238",
          700: "#162E4A",
          600: "#1E3D5C",
          500: "#265070",
        },
        cyan: {
          400: "#22D3EE",
          DEFAULT: "#00D4FF",
          600: "#00B8DE",
          700: "#009BBB",
        },
        glass: "rgba(255,255,255,0.04)",
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.15) 0%, transparent 60%), linear-gradient(180deg, #0B1929 0%, #020B14 100%)",
        "card-glow":
          "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(0,0,0,0) 60%)",
        "cyan-gradient": "linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)",
        "grid-pattern":
          "linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "pulse-cyan": "pulseCyan 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% center" },
          to: { backgroundPosition: "200% center" },
        },
        pulseCyan: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(0,212,255,0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(0,212,255,0)" },
        },
      },
      boxShadow: {
        cyan: "0 0 30px rgba(0,212,255,0.25)",
        "cyan-sm": "0 0 12px rgba(0,212,255,0.15)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover": "0 12px 48px rgba(0,0,0,0.6), 0 0 24px rgba(0,212,255,0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
