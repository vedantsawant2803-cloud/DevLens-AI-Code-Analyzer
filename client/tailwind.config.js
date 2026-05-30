/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Mono'", "monospace"],
        body: ["'DM Sans'", "sans-serif"],
        code: ["'Fira Code'", "monospace"],
      },
      colors: {
        bg: "#080c14",
        surface: "#0d1422",
        border: "#1a2540",
        accent: "#00e5ff",
        accentDim: "#00b8cc",
        green: "#00ff9d",
        orange: "#ff9500",
        red: "#ff3b5c",
        purple: "#b06dff",
        muted: "#4a5980",
        text: "#c8d8f0",
      },
    },
  },
  plugins: [],
};
