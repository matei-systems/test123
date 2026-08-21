"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ScrollNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "bg-ink/72 backdrop-blur-xl border-line" : "border-transparent"
      }`}
    >
      <div className="max-w-[1160px] mx-auto px-6 h-[68px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <div className="w-8 h-8 rounded-[9px] grid place-items-center font-extrabold text-[#241a0c] bg-gold-grad shadow-[0_4px_14px_rgba(219,159,82,0.4)]">
            M
          </div>
          Matei&nbsp;Loyalty
        </Link>
        <div className="flex items-center gap-7">
          <div className="hidden md:flex items-center gap-7">
            <a href="#how" className="text-sm text-dim hover:text-[#F4F1EC] transition-colors">
              So funktioniert&apos;s
            </a>
            <a href="#demo" className="text-sm text-dim hover:text-[#F4F1EC] transition-colors">
              Live-Demo
            </a>
            <a href="#preise" className="text-sm text-dim hover:text-[#F4F1EC] transition-colors">
              Preise
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost text-sm">
              Anmelden
            </Link>
            <Link href="/register" className="btn btn-primary text-sm">
              Registrieren
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
