"use client";

import { useCallback, useEffect, useState } from "react";

export type ColorScheme = "light" | "dark";

const KEY = "matei-theme";

function current(): ColorScheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// Farbschema der ganzen App. Die Klasse "dark" auf <html> setzt das
// Inline-Skript in app/layout.tsx schon vor dem ersten Zeichnen; dieser Hook
// liest sie nur aus und schaltet um (reiner Komfort, nur lokal gespeichert).
export function useColorScheme() {
  const [scheme, setSchemeState] = useState<ColorScheme>("light");

  useEffect(() => {
    setSchemeState(current());
  }, []);

  const setScheme = useCallback((next: ColorScheme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    setSchemeState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Privater Modus o. ä. - Umschalten wirkt trotzdem für diese Seite.
    }
  }, []);

  return { scheme, setScheme, toggle: () => setScheme(current() === "dark" ? "light" : "dark") };
}
