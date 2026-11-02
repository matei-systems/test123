"use client";

import { createContext, useContext, useEffect } from "react";
import { t, type Translations } from "@/lib/marketing/i18n";
import { useColorScheme } from "@/components/ui/useColorScheme";

type Theme = "dark" | "light";

interface Ctx {
  theme: Theme;
  setTheme: (next: Theme) => void;
  t: Translations;
}

const ThemeContext = createContext<Ctx | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// Rahmen der Marketing-Seiten (Für Geschäfte, Dienstleistungen). Das
// Farbschema ist seit dem Designsystem global (Klasse "dark" auf <html>,
// siehe components/ui/useColorScheme.ts) - der Umschalter in der Navigation
// wirkt dadurch auf die ganze App, nicht nur auf diese Seite.
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { scheme, setScheme } = useColorScheme();

  // Sanftes Scrollen zu Sektions-Ankern (#how, #demo, ...) - nur auf diesen
  // Seiten. Bei prefers-reduced-motion schaltet landing.css es wieder ab.
  useEffect(() => {
    document.documentElement.classList.add("lp-smooth");
    return () => document.documentElement.classList.remove("lp-smooth");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: scheme, setTheme: setScheme, t }}>
      <div className="lp">
        <div className="lp-grain" aria-hidden="true" />
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
