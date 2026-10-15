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
        primary: "#8B5CF6",     // brand violet — primary actions only
        primaryhover: "#A78BFA",// interactive hover violet
        primarydark: "#5B4BD6", // deep violet (gradients, logo)
        danger: "#E42535",      // destructive / error red — never brand
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
