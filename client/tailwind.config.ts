import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F8F8F6",
        ink: "#171717",
        muted: "#737373",
        line: "#E5E5E5",
        gold: "#B08D57",
      },
      fontFamily: {
        serif: ["Roboto", "system-ui", "sans-serif"],
        sans: ["Roboto", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        brand: "0.28em",
      },
    },
  },
  plugins: [],
} satisfies Config;
