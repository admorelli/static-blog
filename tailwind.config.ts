import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", "media"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark mode palette
        dark: {
          bg: "#0a0a0a",
          surface: "#171717",
          border: "#3f3f46",
          text: "#e4e4e7",
          muted: "#a3a3a8",
        },
        // Light mode palette
        light: {
          bg: "#fafafa",
          surface: "#ffffff",
          border: "#d4d4d8",
          text: "#18181b",
          muted: "#71717a",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
