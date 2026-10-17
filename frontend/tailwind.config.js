/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#070A12",
          900: "#0B0F19",
          850: "#0E1424",
          800: "#111827",
          700: "#1E293B",
          600: "#334155",
          500: "#475569",
          400: "#94A3B8",
          300: "#CBD5E1",
          100: "#F1F5F9",
          50: "#F8FAFC",
        },
        risk: {
          low: "#10B981",
          "low-bg": "rgba(16, 185, 129, 0.12)",
          "low-border": "rgba(16, 185, 129, 0.3)",
          medium: "#F59E0B",
          "medium-bg": "rgba(245, 158, 11, 0.12)",
          "medium-border": "rgba(245, 158, 11, 0.3)",
          high: "#EF4444",
          "high-bg": "rgba(239, 68, 68, 0.15)",
          "high-border": "rgba(239, 68, 68, 0.35)",
        },
        accent: {
          blue: "#0284C7",
          "blue-hover": "#0369A1",
          cyan: "#06B6D4",
          sky: "#38BDF8",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
}
