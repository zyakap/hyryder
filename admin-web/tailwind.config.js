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
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#1B4FFF",
          600: "#1644E0",
          900: "#0F2347",
        },
        success: "#22c55e",
        warning: "#F59E0B",
        danger: "#ef4444",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
