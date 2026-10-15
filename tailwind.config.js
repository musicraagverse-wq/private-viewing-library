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
        // Apple TV theme — monochrome minimalism: true black, white brand
        // accent, Apple system grays. Red kept ONLY as danger token.
        bg: "#000000",          // primary background — true black
        surface: "#1C1C1E",     // secondary surface (Apple system gray 6)
        card: "#2C2C2E",        // elevated surface (Apple system gray 5)
        border: "#38383A",      // subtle borders (Apple system gray 4)
        primary: "#FFFFFF",     // brand white — primary actions only
        primaryhover: "#E8E8ED",// interactive hover — dimmed white
        primarydark: "#A1A1A6", // deep gray (gradients, logo)
        danger: "#E42535",      // destructive / error red — never brand
        text: "#F5F5F7",        // primary text (Apple near-white)
        muted: "#86868B",       // secondary text (Apple secondary gray)
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
