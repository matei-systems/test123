import type { Config } from "tailwindcss";

// Designsystem Matei Systems (siehe docs/DESIGNSYSTEM.md, Vorlage in Canva).
// Alle Farben sind semantische Rollen auf CSS-Variablen (app/globals.css),
// die Werte für Hell (Standard) und Dunkel liegen dort. Dadurch funktioniert
// der Dunkelmodus in der ganzen App ohne dark:-Varianten an jeder Stelle.
// Format "R G B", damit Tailwinds Deckkraft-Syntax (bg-fg/5) funktioniert.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: v("paper"),
        "paper-2": v("paper-2"),
        surface: v("surface"),
        "surface-2": v("surface-2"),
        fg: v("fg"),
        muted: v("muted"),
        faint: v("faint"),
        accent: v("accent"),
        "accent-hover": v("accent-hover"),
        "accent-strong": v("accent-strong"),
        "on-accent": v("on-accent"),
        stamp: v("stamp"),
        forest: v("forest"),
        "forest-soft": v("forest-soft"),
        "on-forest": v("on-forest"),
        danger: v("danger"),
        warn: v("warn"),
        info: v("info"),
        line: "rgb(var(--line) / 0.12)",
        "line-2": "rgb(var(--line) / 0.2)",

        // Frühere Token-Namen (dunkles Gold-Design) als Aliase auf dieselben
        // Rollen - bestehende Klassen wie text-dim/text-gold/bg-ink bleiben
        // gültig und folgen automatisch dem neuen Design.
        ink: v("paper"),
        bg: v("paper"),
        "auth-surface": v("surface"),
        surface2: v("surface-2"),
        dim: v("muted"),
        gold: v("accent"),
        "gold-bright": v("accent-hover"),
        accent2: v("accent-hover"),
        success: v("forest"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
      backgroundImage: {
        "gold-grad": "linear-gradient(135deg, rgb(var(--accent-strong)) 0%, rgb(var(--accent)) 100%)",
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--shadow) / 0.06), 0 8px 24px -12px rgb(var(--shadow) / 0.18)",
        lift: "0 2px 4px rgb(var(--shadow) / 0.06), 0 18px 40px -18px rgb(var(--shadow) / 0.28)",
      },
      maxWidth: {
        page: "1180px",
      },
    },
  },
  plugins: [],
};
export default config;
