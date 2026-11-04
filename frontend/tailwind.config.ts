import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: "#064E3B",
          dark: "#032E23",
          hover: "#09634C",
        },
        champagne: {
          DEFAULT: "#F8E7C9",
          50: "#FAF1E0",
        },
        cream: {
          DEFAULT: "#FFF8EC",
          input: "#FFFDF9",
        },
        border: {
          DEFAULT: "#E8D3AA",
          subtle: "rgba(232,211,170,0.6)",
        },
        gold: {
          DEFAULT: "#C8963E",
          hover: "#B58432",
          light: "#FBF3E2",
          start: "#E6AF50",
        },
        success: {
          DEFAULT: "#10B981",
          bg: "#E8F8F2",
          border: "#A7F3D0",
        },
        error: {
          DEFAULT: "#B4443C",
          bg: "#FDEDEB",
          border: "#FECACA",
        },
        body: {
          DEFAULT: "#2D3748",
        },
        muted: {
          DEFAULT: "#6B7280",
          light: "#9CA3AF",
        },
      },
      fontFamily: {
        fraunces: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        ui: "12px",
        badge: "9999px",
      },
      boxShadow: {
        "emerald-sm": "0 2px 4px rgba(6,78,59,0.04), 0 1px 2px rgba(6,78,59,0.06)",
        "emerald-md": "0 4px 8px -2px rgba(6,78,59,0.06), 0 12px 24px -4px rgba(6,78,59,0.08)",
        "emerald-lg": "0 8px 16px -4px rgba(6,78,59,0.08), 0 24px 48px -8px rgba(6,78,59,0.12)",
        "emerald-float": "0 20px 40px -10px rgba(6,78,59,0.16)",
      },
      backgroundImage: {
        "emerald-gradient": "linear-gradient(135deg, #064E3B 0%, #032E23 100%)",
        "gold-gradient": "linear-gradient(135deg, #E6AF50 0%, #C8963E 100%)",
        "hero-glow": "radial-gradient(circle at 50% 30%, rgba(200,150,62,0.14) 0%, rgba(248,231,201,0) 70%)",
      },
    },
  },
  plugins: [],
};

export default config;

