import type { Config } from "tailwindcss";

/**
 * Procivic "Civic Daylight" design system (see BRAND.md).
 * - brand (blue)  = trust / primary
 * - accent (purple) = "decoded" / synthesis
 * - signal (red)  = conflict / contradiction / alert  (NEVER a party color)
 * Ramps are hex so Tailwind handles opacity modifiers (e.g. bg-brand-500/70 for glass).
 * shadcn semantic tokens (background/foreground/primary/…) are CSS variables in globals.css.
 */
export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe7ff",
          200: "#bcd3ff",
          300: "#8fb6ff",
          400: "#5b8eff",
          500: "#2e7df6",
          600: "#1f63db",
          700: "#2342b0",
          800: "#21398c",
          900: "#1f3370",
          950: "#161f44",
        },
        accent: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        signal: {
          50: "#fef2f3",
          100: "#fde3e5",
          200: "#fbccd0",
          300: "#f7a3ab",
          400: "#f16f7c",
          500: "#e63d50",
          600: "#d12440",
          700: "#af1a35",
          800: "#921932",
          900: "#7c1a30",
          950: "#440a16",
        },
        // shadcn semantic tokens (CSS variables, HSL) — one design system, themeable.
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "gradient-decoded": "linear-gradient(135deg, #2e7df6 0%, #8b5cf6 100%)",
        "gradient-receipt": "linear-gradient(135deg, #7c3aed 0%, #e63d50 100%)",
        "gradient-decoded-soft":
          "linear-gradient(135deg, #eef4ff 0%, #f5f3ff 100%)",
      },
      boxShadow: {
        "elev-1":
          "0 1px 2px 0 rgb(31 51 112 / 0.06), 0 1px 3px 0 rgb(31 51 112 / 0.08)",
        "elev-2":
          "0 4px 12px -2px rgb(31 51 112 / 0.10), 0 2px 6px -2px rgb(31 51 112 / 0.08)",
        "elev-3":
          "0 18px 40px -12px rgb(31 51 112 / 0.22), 0 8px 16px -8px rgb(46 16 101 / 0.12)",
        glow: "0 0 0 1px rgb(46 125 246 / 0.12), 0 8px 28px -6px rgb(46 125 246 / 0.28)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.3s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
