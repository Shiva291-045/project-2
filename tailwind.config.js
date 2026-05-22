/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        brand: { 400:"#a78bfa", 500:"#8b5cf6", 600:"#7c3aed", 700:"#6d28d9", 800:"#5b21b6" },
        surface: { DEFAULT:"#0d0d1a", card:"#151530", elevated:"#1a1a38", border:"rgba(255,255,255,0.06)" },
        accent: { cyan:"#06b6d4", green:"#10b981", orange:"#f59e0b", pink:"#ec4899", red:"#ef4444" },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "brand-gradient": "linear-gradient(135deg, #7c3aed, #6d28d9)",
      },
      boxShadow: {
        "brand": "0 4px 20px rgba(124,58,237,0.4)",
        "brand-lg": "0 8px 32px rgba(124,58,237,0.5)",
        "card": "0 2px 12px rgba(0,0,0,0.4)",
      },
      animation: {
        "fade-up": "fadeUp 0.45s ease both",
        "fade-in": "fadeIn 0.4s ease both",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeUp: { from:{opacity:0,transform:"translateY(18px)"}, to:{opacity:1,transform:"translateY(0)"} },
        fadeIn: { from:{opacity:0}, to:{opacity:1} },
        float: { "0%,100%":{transform:"translateY(0)"}, "50%":{transform:"translateY(-8px)"} },
      },
    },
  },
  plugins: [],
};