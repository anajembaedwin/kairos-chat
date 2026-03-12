export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#0f0f14",
          raised: "#16161f",
          overlay: "#1e1e2a",
          border: "#2a2a3a",
        },
        accent: {
          DEFAULT: "#7c6af7",
          hover: "#9585f9",
          muted: "#3d3670",
        },
        ink: {
          DEFAULT: "#e8e6f0",
          muted: "#8a8aa0",
          faint: "#4a4a60",
        },
      },
      keyframes: {
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-up": "slideUp 0.2s ease-out",
      },
    },
  },
  plugins: [],
}