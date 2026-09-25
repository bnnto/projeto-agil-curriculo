import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Identidade UNICAP — CEREBRO.md §5 / DESIGN.md
        primary: "#6B1426", // Bordô
        "primary-hover": "#520F1D",
        secondary: "#C89D3C", // Dourado
        canvas: "#F8F9FA",
        success: "#059669",
        warning: "#D97706",
        danger: "#DC2626",
      },
      fontFamily: {
        serif: ["Merriweather", "Georgia", "serif"],
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
      boxShadow: {
        level1:
          "0 1px 3px 0 rgba(30, 41, 59, 0.05), 0 1px 2px -1px rgba(30, 41, 59, 0.03)",
        level2:
          "0 4px 6px -1px rgba(30, 41, 59, 0.08), 0 2px 4px -2px rgba(30, 41, 59, 0.04)",
        level3:
          "0 20px 25px -5px rgba(107, 20, 38, 0.08), 0 8px 10px -6px rgba(30, 41, 59, 0.04)",
      },
    },
  },
  plugins: [],
} satisfies Config;
