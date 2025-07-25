/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1e40af",
          dark: "#1e3a8a",
        },
        secondary: {
          DEFAULT: "#dc2626",
          dark: "#b91c1c",
        },
        accent: "#7c3aed",
        success: "#16a34a",
        warning: "#ea580c",
        slate: {
          850: "#1a202c",
          950: "#0f1419",
        },
      },
      fontFamily: {
        samarkan: ['"Samarkan Normal V2"', 'cursive'],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        devanagari: [
          "Noto Sans Devanagari",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out",
        slideIn: "slideIn 0.3s ease-out",
        "pulse-slow": "pulse 2s infinite",
        "bounce-slow": "bounce 2s infinite",
        "spin-slow": "spin 12s linear infinite",
        "spin-slow-reverse": "spin-reverse 12s linear infinite",
        strikeAppear: "strikeAppear 0.5s ease",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "spin-reverse": { 
          "0%": { transform: "rotate(0deg)" }, 
          "100%": { transform: "rotate(-360deg)"}
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        strikeAppear: {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "0" },
          "50%": { transform: "scale(1.2) rotate(180deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(360deg)", opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.3)",
        "glow-lg": "0 0 40px rgba(59, 130, 246, 0.4)",
      },
    },
  },
  plugins: [],
};
