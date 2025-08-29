/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
      // add other folders if you use them
    ],
    theme: {
      screens: {
        "xxs": "400px",
        "xs": "600px",
        "sm": "750px",
        "md": "880px",
        "lg": "1024px",
        "xl": "1280px",
      },
      fontSize: {
        "xs": "0.9rem",
        "sm": "1.1rem",
        "xl": "1.3rem",
        "2xl": "1.5rem",
        "3xl": "2.1rem",
        "4xl": "2.8rem",
      },
      extend: {
        colors: {
          "light-1": "#ffffff",
          "light-2": "#efefef",
          "light-3": "#d0d4db",
          "dark-1": "#121212",
          "dark-2": "#303030",
          "dark-3": "#424242",
        },
      },
    },
    plugins: [require('@tailwindcss/typography')],
  };
  