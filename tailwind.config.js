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
        // ShortDrama design tokens — cinematic dark theme, deep-blue undertones
        bg: "#0B0D12",          // primary background
        surface: "#161A22",     // secondary surface
        card: "#222734",        // elevated surface
        border: "#292B34",      // subtle borders
        primary: "#E42535",     // brand red — primary actions only
        primaryhover: "#F03545",// interactive hover red
        primarydark: "#b20710", // deep red (legacy)
        text: "#F7F8FA",        // primary text
        muted: "#A5ACBB",       // secondary text
        gold: "#f5c518",
        info: "#5699FF",        // informational blue — sparing use
      },
      fontFamily: {
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
