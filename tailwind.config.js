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
        // The Drama Den: bold, vibrant, fun
        den: "#1a0b2e",
        denlight: "#251344",
        card: "#2d1a4e",
        edge: "#4a2d7a",
        pop: "#ff4d8d",
        popdark: "#e6397a",
        sunny: "#ffd93d",
        teal: "#2dd4bf",
        grape: "#a855f7",
        cream: "#fff8f0",
        muted: "#c4b5d9",
      },
      fontFamily: {
        display: ["'Baloo 2'", "'Fredoka'", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["'Nunito'", "ui-rounded", "system-ui", "sans-serif"],
      },
      borderRadius: {
        'den': '1.5rem',
      },
    },
  },
  plugins: [],
};
