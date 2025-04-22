// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Следить за классами в главном HTML файле
    "./src/**/*.{js,ts,jsx,tsx}", // Следить за классами во всех файлах внутри src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}