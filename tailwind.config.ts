import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cale: {
          primary: "rgb(var(--cale-primary) / <alpha-value>)",
          accent: "rgb(var(--cale-accent) / <alpha-value>)",
          bg: "rgb(var(--cale-bg) / <alpha-value>)",
          card: "rgb(var(--cale-card) / <alpha-value>)",
          input: "rgb(var(--cale-input) / <alpha-value>)",
          userBubble: "rgb(var(--cale-userBubble) / <alpha-value>)",
          thinking: "rgb(var(--cale-thinking) / <alpha-value>)",
          divider: "rgb(var(--cale-divider) / <alpha-value>)",
          textDark: "rgb(var(--cale-textDark) / <alpha-value>)",
          textLight: "rgb(var(--cale-textLight) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        bubble: "18px",
        card: "14px",
        pill: "22px",
      },
    },
  },
  plugins: [],
};

export default config;
