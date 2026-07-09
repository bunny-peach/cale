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
          primary: "#E8A0BF",
          accent: "#D4849F",
          bg: "#FDF6F0",
          card: "#FFFFFF",
          input: "#F5EDE8",
          userBubble: "#F5E0EA",
          thinking: "#FFF0F5",
          divider: "#F0E0E6",
          textDark: "#2D2D2D",
          textLight: "#8E8E93",
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
