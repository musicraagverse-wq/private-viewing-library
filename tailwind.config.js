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
        // Short Drama: clean dark theme with red accent (EveryDrama-inspired)
        bg: "#0f0f13",
        surface: "#1a1a21",
        card: "#22222b",
        border: "#2e2e38",
        primary: "#e50914",
        primarydark: "#b20710",
        text: "#ffffff",
        muted: "#9ca3af",
        gold: "#f5c518",
      },
      fontFamily: {
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
