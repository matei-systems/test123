"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { t, type Translations } from "@/lib/marketing/i18n";

type Theme = "dark" | "light";

interface Ctx {
  theme: Theme;
  setTheme: (next: Theme) => void;
  t: Translations;
}

const ThemeContext = createContext<Ctx | null>(null);

const THEME_KEY = "matei-landing-theme";

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// Bewusst client-seitig und ohne SSR-Persistenz (kein Cookie): reiner
// Komfort für Besucher auf DIESER Seite, kein Tracking, kein Server-Zustand.
// Start immer dunkel (Server-Default) - falls im localStorage "light"
// hinterlegt ist, wird direkt nach dem Mount umgeschaltet.
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") setThemeState(saved);
    } catch {
      // Privater Modus o.ä. - Standardwert bleibt einfach bestehen.
    }
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, t }}>
      <div className="lp" data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
