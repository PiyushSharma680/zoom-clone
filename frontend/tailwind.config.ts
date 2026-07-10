import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Zoom brand palette
        zoom: {
          blue: "#2D8CFF",
          bluehover: "#2681F2",
          dark: "#1A1A1A",
          panel: "#232333",
          room: "#0E0E10",
          gray: "#747487",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.08)",
        modal: "0 12px 40px rgba(0,0,0,0.24)",
      },
    },
  },
  plugins: [],
};

export default config;
