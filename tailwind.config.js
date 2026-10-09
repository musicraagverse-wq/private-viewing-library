/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Private theater: warm blacks, amber marquee glow, cream text
        screen: "#0c0a08",
        lounge: "#14110c",
        seat: "#1c1812",
        rope: "#2e2820",
        marquee: "#f5a524",
        marqueeDim: "#b97a1a",
        spotlight: "#ffd98a",
        cream: "#f5ead6",
        muted: "#a89f8d",
      },
      fontFamily: {
        display: ["Georgia", "'Times New Roman'", "serif"],
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
