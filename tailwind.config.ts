import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)", "sans-serif"],
        schibsted: ["var(--font-schibsted)", "sans-serif"],
        noto: ["var(--font-noto)", "sans-serif"],
        fustat: ["var(--font-fustat)", "sans-serif"],
      },
      colors: {
        background: "#ffffff",
        foreground: "#000000",
        grayText: "#505050",
        greenUpgrade: "rgba(90,225,76,0.89)",
        darkBadge: "#0e1311",
      },
    },
  },
  plugins: [],
};
export default config;
