import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAF7F2",
        surface: "#FFFFFF",
        "surface-raised": "#FAF7F2",
        "surface-hover": "#F5EFE6",
        border: "#E5DBCA",
        "border-light": "#EFE9DF",
        brand: {
          crimson: "#E11D48",
          rose: "#F43F5E",
          amber: "#F59E0B",
          gold: "#D97706",
          emerald: "#10B981",
          cyan: "#0284C7",
          purple: "#7C3AED",
        },
        primary: {
          DEFAULT: "#E11D48",
          hover: "#BE123C",
          light: "#FFE4E6",
          glow: "rgba(225, 29, 72, 0.25)",
        },
      },
      backgroundImage: {
        "gradient-cinematic": "linear-gradient(135deg, #E11D48 0%, #EA580C 50%, #9333EA 100%)",
        "gradient-royal": "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        "gradient-gold": "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
      },
      boxShadow: {
        soft: "0 2px 10px -1px rgba(45, 37, 34, 0.04), 0 1px 3px -1px rgba(45, 37, 34, 0.03)",
        "soft-md": "0 4px 20px -2px rgba(45, 37, 34, 0.06), 0 2px 6px -1px rgba(45, 37, 34, 0.04)",
        "soft-lg": "0 10px 30px -4px rgba(45, 37, 34, 0.08), 0 4px 12px -2px rgba(45, 37, 34, 0.04)",
        luxury: "0 4px 20px -2px rgba(45, 37, 34, 0.04), 0 2px 6px -1px rgba(45, 37, 34, 0.02)",
        "luxury-md": "0 10px 25px -3px rgba(45, 37, 34, 0.06), 0 4px 10px -2px rgba(45, 37, 34, 0.03)",
        "luxury-lg": "0 20px 35px -5px rgba(45, 37, 34, 0.08), 0 10px 15px -5px rgba(45, 37, 34, 0.04)",
        "glow-crimson": "0 4px 20px -2px rgba(225, 29, 72, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
