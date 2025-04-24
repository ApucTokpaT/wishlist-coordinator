// frontend/tailwind.config.js
const { fontFamily } = require("tailwindcss/defaultTheme") // Импортируем дефолтные шрифты

/** @type {import('tailwindcss').Config} */
module.exports = { // Используем module.exports, если файл .js, а не .mjs или type:module в package.json
  darkMode: ["class"], // Настройка темной темы Shadcn
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}', // Убедимся, что папка src включена
    './index.html' // Включаем HTML для поиска классов
	],
  prefix: "", // Префикс для классов Tailwind (оставляем пустым)
  theme: {
    container: { // Настройки контейнера Shadcn
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // --- ДОБАВЛЕНЫ ШРИФТЫ ---
      fontFamily: {
         sans: ['"Comic Neue"', ...fontFamily.sans], // Основной шрифт
         heading: ['Bangers', ...fontFamily.sans],   // Шрифт заголовков
      },
      // -----------------------
      colors: { // Настройки цветов Shadcn (оставляем как есть после init)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: { // Настройки скругления Shadcn (оставляем)
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: { // Настройки анимации Shadcn (оставляем)
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: { // Настройки анимации Shadcn (оставляем)
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      // --- МОЖНО ДОБАВИТЬ КАСТОМНЫЕ ТЕНИ/ОБВОДКИ ЗДЕСЬ ПОЗЖЕ ---
      // boxShadow: {
      //   'comic': '4px 4px 0px #000', 
      // }
      // ----------------------------------------------------
    },
  },
  plugins: [require("tailwindcss-animate")], // Плагин анимации Shadcn
}