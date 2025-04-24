// frontend/tailwind.config.js
const { fontFamily } = require("tailwindcss/defaultTheme") // Import default fonts

/** @type {import('tailwindcss').Config} */
module.exports = { // Use module.exports for .js files unless type:module is set
  darkMode: ["class"], // Shadcn dark mode setup
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}', // Ensure src folder is included
    './index.html' // Include HTML file
	],
  prefix: "", // No prefix for Tailwind classes
  theme: {
    container: { // Shadcn container settings (keep if present)
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // --- ADDED COMIC FONTS ---
      fontFamily: {
         sans: ['"Comic Neue"', ...fontFamily.sans], // Main sans-serif font
         heading: ['Bangers', ...fontFamily.sans],   // Heading font
      },
      // --- /ADDED COMIC FONTS ---

      // --- ADDED/MODIFIED COLORS & SHADOWS ---
      colors: { 
        // Keep Shadcn base colors for UI elements like inputs, borders, rings
        border: "hsl(var(--border))",
        input: "hsl(var(--input))", 
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", // Main page background
        foreground: "hsl(var(--foreground))", // Main text color

        // Override Shadcn primary for our comic buttons
        primary: { 
          DEFAULT: "#facc15", // Bright Yellow
          foreground: "#1f2937", // Dark Gray text on yellow
          dark: "#eab308" // Darker yellow for hover
        },
        // Define comic secondary color
        secondary: { 
          DEFAULT: "#60a5fa", // Light Blue
          foreground: "#ffffff", // White text
          dark: "#3b82f6" // Darker blue for hover/accents
        },
        // Define comic destructive color
        destructive: { 
          DEFAULT: "#ef4444", // Red
          foreground: "#ffffff", // White text
          dark: "#dc2626" // Darker red for hover
        },
        // Define specific comic color palette for easy access
        comic: {
            blue: "#60a5fa",   // Lighter Blue (matches secondary)
            red: "#ef4444",    // Red (matches destructive)
            yellow: "#facc15", // Yellow (matches primary)
            green: "#22c55e",  // Green
            black: "#1f2937",  // Black/very dark gray for borders/text
            white: "#ffffff",  // White
        },
        // Keep other Shadcn colors (or override if needed)
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" }, 
      },
      boxShadow: {
        'comic': '4px 4px 0px #1f2937', // Sharp offset black shadow
        'comic-sm': '2px 2px 0px #1f2937' // Smaller version
      },
      // --- /ADDED/MODIFIED COLORS & SHADOWS ---

      borderRadius: { // Shadcn border radius settings (keep)
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: { // Shadcn animation settings (keep)
        "accordion-down": { /* ... */ },
        "accordion-up": { /* ... */ },
      },
      animation: { // Shadcn animation settings (keep)
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")], // Shadcn animation plugin
}