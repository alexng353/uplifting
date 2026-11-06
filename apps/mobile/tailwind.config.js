/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Ember, the redesign's action colour (design-system.html). 500 is the accent;
        // ink is the text colour on an Ember fill, since white fails contrast there.
        ember: {
          50: "#FEF3EC",
          100: "#FDE2D0",
          200: "#FAC4A1",
          300: "#F7A670",
          400: "#F59A5E",
          500: "#F2894B",
          600: "#DE7536",
          700: "#B85B26",
          800: "#8A431C",
          900: "#5C2D13",
          950: "#2E1609",
          ink: "#1F0E04",
        },
      },
    },
  },
  plugins: [],
};
