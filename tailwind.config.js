/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#241A5E",
        rani: "#D6246E",
        marigold: "#F7A81B",
        peacock: "#0F8B8D",
        mist: "#F5F2FB",
        ink: "#1C1633",
      },
      fontFamily: {
        display: ['"Yatra One"', "Georgia", "serif"],
        body: ['"Mukta"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
