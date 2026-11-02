"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SubmitButton from "@/components/SubmitButton";
import { hasMinRole, type Role } from "@/lib/permissions";
import { LogoMark } from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";

const LINKS = [
  { href: "/dashboard", label: "Übersicht", min: "staff" as Role },
  { href: "/dashboard/scan", label: "Scannen", min: "staff" as Role },
  { href: "/dashboard/programs", label: "Programme", min: "staff" as Role },
  { href: "/dashboard/belohnungen", label: "Belohnungen", min: "staff" as Role },
  { href: "/dashboard/aktionen", label: "Aktionen", min: "staff" as Role },
  { href: "/dashboard/customers", label: "Kunden", min: "staff" as Role },
  { href: "/dashboard/profil", label: "Geschäftsprofil", min: "staff" as Role },
  { href: "/dashboard/activity", label: "Aktivität", min: "admin" as Role },
  { href: "/dashboard/locations", label: "Standorte", min: "admin" as Role },
  { href: "/dashboard/team", label: "Team", min: "staff" as Role },
  { href: "/dashboard/support", label: "Support", min: "staff" as Role },
  { href: "/dashboard/billing", label: "Abrechnung", min: "staff" as Role },
];

function NavLinks({ onNavigate, role }: { onNavigate?: () => void; role: Role | null }) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => hasMinRole(role, l.min));
  return (
    <>
      {links.map((l) => {
        const active = l.href === "/dashboard" ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={`px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border-l-2 ${
              active
                ? "bg-fg/[0.06] text-gold-bright border-gold"
                : "border-transparent text-muted hover:text-fg hover:bg-fg/[0.04] hover:translate-x-0.5"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );
}

function Logo({ orgName }: { orgName: string | null }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-2 pt-2 pb-4 rounded-xl" aria-label="Zur Übersicht">
      <LogoMark size={34} />
      <div className="min-w-0">
        <div className="font-display text-[19px] font-semibold leading-none text-fg">matei</div>
        <div className="mt-1 text-xs text-muted truncate">{orgName ?? "Kein Betrieb"}</div>
      </div>
    </Link>
  );
}

export default function Sidebar({
  orgName,
  role,
  signOutAction,
  isPlatformAdmin = false,
}: {
  orgName: string | null;
  role: Role | null;
  signOutAction: (formData: FormData) => void | Promise<void>;
  isPlatformAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-paper/90 backdrop-blur border-b border-line">
        <Logo orgName={orgName} />
        <button
          aria-label="Menü öffnen"
          onClick={() => setOpen(true)}
          className="p-2 -mr-2 text-fg"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 animate-[fadeIn_.2s_ease]" onClick={() => setOpen(false)} />
          <aside className="absolute top-0 left-0 h-full w-[260px] bg-surface-2 border-r border-line p-4 flex flex-col gap-1 enter">
            <div className="flex items-center justify-between mb-2">
              <Logo orgName={orgName} />
              <button aria-label="Menü schließen" onClick={() => setOpen(false)} className="p-2 text-muted">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} role={role} />
            {isPlatformAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm text-gold hover:text-gold-bright hover:bg-fg/[0.04] transition-colors"
              >
                Admin-Panel ↗
              </Link>
            )}
            <div className="mt-auto pt-3">
              <div className="flex items-center justify-between gap-2 px-1 mb-3">
                <Link href="/konto" onClick={() => setOpen(false)} className="btn btn-soft btn-sm">Mein Wallet</Link>
                <ThemeToggle />
              </div>
              <div className="flex items-center gap-3 px-3 mb-2 text-[11px] text-faint">
                <Link href="/impressum" className="hover:text-gold-bright">Impressum</Link>
                <Link href="/datenschutz" className="hover:text-gold-bright">Datenschutz</Link>
                <Link href="/agb" className="hover:text-gold-bright">AGB</Link>
              </div>
              <form action={signOutAction}>
                <SubmitButton pendingText="Wird abgemeldet…" className="btn btn-ghost w-full text-sm">
                  Abmelden
                </SubmitButton>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col border-r border-line bg-surface-2 p-4 gap-1">
        <Logo orgName={orgName} />
        <NavLinks role={role} />
        {isPlatformAdmin && (
          <Link
            href="/admin"
            className="px-3 py-2.5 rounded-lg text-sm text-gold hover:text-gold-bright hover:bg-fg/[0.04] transition-colors"
          >
            Admin-Panel ↗
          </Link>
        )}
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between gap-2 px-1 mb-3">
            <Link href="/konto" className="btn btn-soft btn-sm">Mein Wallet</Link>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 px-3 mb-2 text-[11px] text-faint">
            <Link href="/impressum" className="hover:text-gold-bright">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-gold-bright">Datenschutz</Link>
            <Link href="/agb" className="hover:text-gold-bright">AGB</Link>
          </div>
          <form action={signOutAction}>
            <button className="btn btn-ghost w-full text-sm">Abmelden</button>
          </form>
        </div>
      </aside>
    </>
  );
}
