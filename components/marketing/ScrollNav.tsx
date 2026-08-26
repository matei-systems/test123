"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/marketing/ThemeProvider";
import ScrollProgress from "@/components/marketing/ScrollProgress";

const SECTIONS = ["how", "demo", "preise"] as const;

export default function ScrollNav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme, t } = useTheme();
  const pathname = usePathname();
  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hebt den Nav-Link der Sektion hervor, die gerade im mittleren Drittel
  // des Viewports steht - nur relevant auf der Startseite, die anderen
  // Seiten haben diese Anker gar nicht.
  useEffect(() => {
    if (!onHome) return;
    const observers: IntersectionObserver[] = [];
    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (!el) continue;
      const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setActive(id), {
        rootMargin: "-45% 0px -50% 0px",
      });
      io.observe(el);
      observers.push(io);
    }
    return () => observers.forEach((io) => io.disconnect());
  }, [onHome]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const href = (anchor: string) => (onHome ? `#${anchor}` : `/#${anchor}`);

  const links = (
    <>
      <a href={href("how")} className="lp-nav-link text-sm text-dim hover:text-gold-bright transition-colors" data-active={active === "how"}>
        {t.nav.how}
      </a>
      <a href={href("demo")} className="lp-nav-link text-sm text-dim hover:text-gold-bright transition-colors" data-active={active === "demo"}>
        {t.nav.demo}
      </a>
      <a href={href("preise")} className="lp-nav-link text-sm text-dim hover:text-gold-bright transition-colors" data-active={active === "preise"}>
        {t.nav.pricing}
      </a>
      <Link href="/dienstleistungen" className="text-sm text-faint hover:text-dim transition-colors">
        {t.nav.services}
      </Link>
    </>
  );

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${
          scrolled ? "backdrop-blur-xl border-line" : "border-transparent"
        }`}
        style={{ background: scrolled ? "color-mix(in srgb, var(--lp-bg) 72%, transparent)" : "transparent" }}
      >
        <div className="max-w-[1160px] mx-auto px-6 h-[68px] flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight shrink-0">
            <div className="lp-logo-mark w-8 h-8 rounded-[9px] grid place-items-center font-extrabold text-[#241a0c] bg-gold-grad shadow-[0_4px_14px_rgba(219,159,82,0.4)]">
              M
            </div>
            <span>Matei&nbsp;Loyalty</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6">{links}</div>

            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 rounded-full border border-line grid place-items-center text-dim hover:text-gold-bright transition-colors shrink-0"
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

            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login" className="btn btn-ghost text-sm">
                {t.nav.login}
              </Link>
              <Link href="/register" className="btn btn-primary text-sm">
                {t.nav.register}
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-9 h-9 rounded-full border border-line grid place-items-center text-dim shrink-0"
              aria-label={mobileOpen ? "Menü schließen" : "Menü öffnen"}
              aria-expanded={mobileOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px]">
                {mobileOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        <div
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out border-t border-line ${
            mobileOpen ? "max-h-[320px] opacity-100" : "max-h-0 opacity-0"
          }`}
          style={{ background: "var(--lp-bg)" }}
        >
          <div className="px-6 py-5 flex flex-col gap-4">
            {links}
            <div className="flex items-center gap-2 pt-2 sm:hidden">
              <Link href="/login" className="btn btn-ghost text-sm flex-1 text-center">
                {t.nav.login}
              </Link>
              <Link href="/register" className="btn btn-primary text-sm flex-1 text-center">
                {t.nav.register}
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <ScrollProgress />
    </>
  );
}
