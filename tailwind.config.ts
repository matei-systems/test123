import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0F",
        surface: "#14141E",
        surface2: "#1A1A26",
        accent: "#635BFF",
        accent2: "#9D7BFF",
      },
    },
  },
  plugins: [],
};
export default config;
