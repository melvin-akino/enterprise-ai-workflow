import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg:      "var(--bg)",
          bg2:     "var(--bg2)",
          bg3:     "var(--bg3)",
          border:  "var(--border)",
          border2: "var(--border2)",
          accent:  "var(--accent)",
          text:    "var(--text)",
          muted:   "var(--text2)",
          dim:     "var(--text3)",
          green:   "var(--green)",
          amber:   "var(--amber)",
          red:     "var(--red)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "DM Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "DM Mono", "monospace"],
      },
      keyframes: {
        stepIn: {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.35" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "step-in":   "stepIn 0.3s ease forwards",
        "pulse-dot": "pulseDot 1.4s ease-in-out infinite",
        "fade-up":   "fadeUp 0.25s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
