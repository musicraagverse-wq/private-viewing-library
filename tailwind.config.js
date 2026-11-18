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
        // Crimson Cinema — deep charcoal-black with a warm undertone,
        // bold crimson brand accent. Gold kept for ratings; danger is a
        // brighter orange-red so it stays distinct from brand crimson.
        bg: "#0C0A0B",          // primary background — near-black, warm
        surface: "#1A1214",     // secondary surface — dark warm maroon
        card: "#261619",        // elevated surface — warm dark maroon
        border: "#3D2329",      // subtle borders — muted maroon-gray
        primary: "#E50914",     // brand crimson — primary actions only
        primaryhover: "#F6121D",// interactive hover — brighter crimson
        primarydark: "#8B0A12", // deep crimson (gradients, depth)
        danger: "#FF453A",      // destructive / error — brighter orange-red
        text: "#F5F5F7",        // primary text (near-white)
        muted: "#A8A0A3",       // secondary text (warm gray)
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
