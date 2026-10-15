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
        // ShortDrama design tokens — luxurious cinematic dark theme
        bg: "#0B0C10",          // primary background
        surface: "#121318",     // secondary background
        card: "#1A1C24",        // elevated surface
        border: "#292B34",      // subtle borders
        primary: "#E12535",     // brand red
        primaryhover: "#F03545",// interactive hover red
        primarydark: "#b20710", // deep red (legacy)
        text: "#F5F5F7",        // primary text
        muted: "#A0A3AE",       // secondary text
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
