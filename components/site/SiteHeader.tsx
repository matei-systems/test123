"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

export const SITE_NAV = [
  { href: "/fuer-kunden", label: "Für Kunden" },
  { href: "/fuer-geschaefte", label: "Für Geschäfte" },
  { href: "/geschaefte", label: "Geschäfte entdecken" },
  { href: "/faq", label: "FAQ" },
];

// Login-Status wird im Browser aus der Supabase-Session gelesen - so bleiben
// die öffentlichen Seiten statisch auslieferbar, eingeloggte Nutzer sehen
// trotzdem "Mein Bereich" (führt über /weiter rollenabhängig zu Konto oder
// Dashboard).
function useLoggedIn() {
  const [state, setState] = useState<"unknown" | "in" | "out">("unknown");
  useEffect(() => {
    let alive = true;
    createClient()
      .auth.getSession()
      .then(({ data }) => alive && setState(data.session ? "in" : "out"))
      .catch(() => alive && setState("out"));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

function AccountLinks({ state, stacked = false }: { state: "unknown" | "in" | "out"; stacked?: boolean }) {
  const cls = stacked ? "w-full" : "";
  if (state === "in") {
    return (
      <Link href="/weiter" className={`btn btn-primary btn-sm ${cls}`}>
        Mein Bereich
      </Link>
    );
  }
  return (
    <div className={`flex gap-2 ${stacked ? "flex-col" : "items-center"} ${state === "unknown" ? "opacity-0" : "opacity-100"} transition-opacity`}>
      <Link href="/login" className={`btn btn-ghost btn-sm ${cls}`}>
        Anmelden
      </Link>
      <Link href="/register" className={`btn btn-primary btn-sm ${cls}`}>
        Konto erstellen
      </Link>
    </div>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loggedIn = useLoggedIn();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled || open ? "border-b border-line bg-paper/90 backdrop-blur-md" : "border-b border-transparent bg-paper/0"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 sm:px-6 md:h-[72px] md:px-8">
        <Logo />
        <nav aria-label="Hauptnavigation" className="hidden items-center gap-1 lg:flex">
          {SITE_NAV.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-[15px] font-medium transition ${
                  active ? "bg-fg/[0.06] text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <AccountLinks state={loggedIn} />
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
            className="inline-grid h-10 w-10 place-items-center rounded-full border border-line text-fg"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div id="mobile-menu" className="h-[calc(100dvh-64px)] overflow-y-auto border-t border-line bg-paper px-4 pb-8 pt-4 lg:hidden">
          <nav aria-label="Hauptnavigation mobil" className="flex flex-col">
            {SITE_NAV.map((l) => (
              <Link key={l.href} href={l.href} className="flex min-h-[52px] items-center justify-between border-b border-line text-lg font-medium">
                {l.label}
                <span aria-hidden="true" className="text-faint">→</span>
              </Link>
            ))}
            <Link href="/kontakt" className="flex min-h-[52px] items-center justify-between border-b border-line text-lg font-medium">
              Kontakt
              <span aria-hidden="true" className="text-faint">→</span>
            </Link>
          </nav>
          <div className="mt-6">
            <AccountLinks state={loggedIn} stacked />
          </div>
        </div>
      )}
    </header>
  );
}
