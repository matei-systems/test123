"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useThemeLang } from "@/components/marketing/ThemeLangProvider";

export default function ScrollNav() {
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme, lang, setLang, t } = useThemeLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "backdrop-blur-xl border-line" : "border-transparent"
      }`}
      style={{ background: scrolled ? "color-mix(in srgb, var(--lp-bg) 72%, transparent)" : "transparent" }}
    >
      <div className="max-w-[1160px] mx-auto px-6 h-[68px] flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight shrink-0">
          <div className="w-8 h-8 rounded-[9px] grid place-items-center font-extrabold text-[#241a0c] bg-gold-grad shadow-[0_4px_14px_rgba(219,159,82,0.4)]">
            M
          </div>
          <span>Matei&nbsp;Loyalty</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6">
            <a href="#how" className="text-sm text-dim hover:text-gold-bright transition-colors">
              {t.nav.how}
            </a>
            <a href="#demo" className="text-sm text-dim hover:text-gold-bright transition-colors">
              {t.nav.demo}
            </a>
            <a href="#preise" className="text-sm text-dim hover:text-gold-bright transition-colors">
              {t.nav.pricing}
            </a>
          </div>

          <div className="flex items-center gap-1 border border-line rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setLang(lang === "de" ? "en" : "de")}
              className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-dim hover:text-gold-bright transition-colors"
              aria-label="Sprache wechseln / Switch language"
              title={lang === "de" ? "Switch to English" : "Auf Deutsch umschalten"}
            >
              {lang === "de" ? "EN" : "DE"}
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8 rounded-full grid place-items-center text-dim hover:text-gold-bright transition-colors"
              aria-label={theme === "dark" ? "Helles Design" : "Dunkles Design"}
              title={theme === "dark" ? "Helles Design" : "Dunkles Design"}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost text-sm">
              {t.nav.login}
            </Link>
            <Link href="/register" className="btn btn-primary text-sm">
              {t.nav.register}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
