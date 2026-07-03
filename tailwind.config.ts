import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Telia Purpur-tokens (porterade från telia_workspace_all4.html)
        purple: {
          50: "#FAF0FF",
          100: "#F4E0FF",
          200: "#E0BAFF",
          300: "#CC88F0",
          400: "#B44FEA",
          500: "#990AE3",
          600: "#7300AD",
          700: "#570080",
          800: "#3D0059",
          900: "#29003E",
        },
        // Mörkt tema — djup nästan-svart botten med lila ton
        ink: {
          950: "#0B0313",
          900: "#120621",
          850: "#180A2B",
          800: "#1F0E36",
          700: "#2B1547",
        },
      },
      fontFamily: {
        sans: ["var(--font-telia)", "system-ui", "sans-serif"],
        heading: ["var(--font-telia-heading)", "var(--font-telia)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
