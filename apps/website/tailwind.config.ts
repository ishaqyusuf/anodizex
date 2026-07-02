import baseConfig from "@afterservice/ui/tailwind.config";
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  presets: [baseConfig],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0faf8",
          100: "#d7f3ed",
          200: "#b0e7dd",
          300: "#7ad4c6",
          400: "#4bbbaa",
          500: "#009b98", // Canonical brand teal
          600: "#1b7d7b",
          700: "#1a6463",
          800: "#195050",
          900: "#194343",
        },
        dark: {
          50: "#f6f7f4",
          100: "#e9eee6",
          800: "#233429",
          900: "#17211b", // Canonical body text/background
          950: "#0d1410",
        },
      },
    },
  },
} satisfies Config;
