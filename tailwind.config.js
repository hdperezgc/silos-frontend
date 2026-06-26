/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        granjazul: {
          blue: "#14315c",
          orange: "#f4862a",
        },
      },
    },
  },
  plugins: [],
}

