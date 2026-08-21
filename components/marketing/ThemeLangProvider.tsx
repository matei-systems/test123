"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Lang, type Translations } from "@/lib/marketing/i18n";

type Theme = "dark" | "light";

interface Ctx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const ThemeLangContext = createContext<Ctx | null>(null);

const THEME_KEY = "matei-landing-theme";
const LANG_KEY = "matei-landing-lang";

export function useThemeLang() {
  const ctx = useContext(ThemeLangContext);
  if (!ctx) throw new Error("useThemeLang must be used within ThemeLangProvider");
  return ctx;
}

// Bewusst client-seitig und ohne SSR-Persistenz (kein Cookie): reiner
// Komfort für Besucher auf DIESER Seite, kein Tracking, kein Server-Zustand.
// Start immer dunkel/Deutsch (Server-Default) - falls im localStorage etwas
// anderes hinterlegt ist, wird direkt nach dem Mount umgeschaltet.
export default function ThemeLangProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [lang, setLangState] = useState<Lang>("de");

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "light" || savedTheme === "dark") setThemeState(savedTheme);
      const savedLang = localStorage.getItem(LANG_KEY);
      if (savedLang === "de" || savedLang === "en") setLangState(savedLang);
    } catch {
      // Privater Modus o.ä. - Standardwerte bleiben einfach bestehen.
    }
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
  }

  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  }

  return (
    <ThemeLangContext.Provider value={{ theme, setTheme, lang, setLang, t: translations[lang] }}>
      <div className="lp" data-theme={theme}>
        {children}
      </div>
    </ThemeLangContext.Provider>
  );
}
