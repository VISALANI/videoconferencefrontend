/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",     // Blue
        secondary: "#9333ea",   // Purple
        accent: "#f97316",      // Orange
        darkBg: "#0f172a",      // Deep navy background
        lightBg: "#f8fafc"      // Soft light background
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glow: "0 0 15px rgba(147, 51, 234, 0.4)", // Subtle neon glow
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      transitionTimingFunction: {
        "in-expo": "cubic-bezier(0.95, 0.05, 0.795, 0.035)",
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
