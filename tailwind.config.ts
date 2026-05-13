import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand palette
        chayo: {
          bg: "#0A0A0A",
          surface: "#141414",
          border: "#242424",
          text: "#F5F0EB",
          muted: "#8A8580",
          accent: "#C9A84C",
          "accent-hover": "#DDB95F",
          "accent-dim": "#C9A84C33",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.5rem, 8vw, 5.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2rem, 5vw, 3.75rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.5rem, 3.5vw, 2.5rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
      },
      spacing: {
        section: "clamp(4rem, 10vw, 8rem)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scrim-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "0.65" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease forwards",
        "fade-in": "fade-in 0.5s ease forwards",
        "scrim-in": "scrim-in 1s ease forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
