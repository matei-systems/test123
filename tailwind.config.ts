import type { Config } from "tailwindcss";
const config: Config = {
  // "class" statt des Standards "media": nur die Marketing-Landingpage nutzt
  // dark: aktuell (Hell/Dunkel-Umschalter, siehe components/marketing/
  // ThemeProvider.tsx) - der Rest der App (Dashboard, Auth) bleibt bewusst
  // fest dunkel und verwendet dark: nirgends, ändert sich also durch diese
  // Einstellung nicht.
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0F",
        surface: "#14141E",
        surface2: "#1A1A26",
        accent: "#635BFF",
        accent2: "#9D7BFF",
        // Gold/charcoal palette from design-reference/matei-loyalty-pitch.html.
        // Used by the auth area (P2). Kept separate from the tokens above,
        // which are still used by the dashboard's current indigo theme.
        ink: "#0B0A0D",
        "auth-surface": "#16131A",
        line: "rgba(255,255,255,0.08)",
        "line-2": "rgba(255,255,255,0.14)",
        dim: "#A6A099",
        faint: "#6E685F",
        gold: "#E8B573",
        "gold-bright": "#F6D19A",
      },
      backgroundImage: {
        "gold-grad": "linear-gradient(135deg,#F6D6A0,#DB9F52)",
      },
    },
  },
  plugins: [],
};
export default config;
