"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SubmitButton from "@/components/SubmitButton";
import type { AdminRole } from "@/lib/admin";

const LINKS = [
  { href: "/admin", label: "Übersicht" },
  { href: "/admin/organizations", label: "Unternehmen" },
  { href: "/admin/users", label: "Benutzer" },
  { href: "/admin/subscriptions", label: "Abonnements" },
  { href: "/admin/invoices", label: "Rechnungen" },
  { href: "/admin/support", label: "Support" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={`px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border-l-2 ${
              active
                ? "bg-white/[0.06] text-gold-bright border-gold"
                : "border-transparent text-[#A6A099] hover:text-[#F4F1EC] hover:bg-white/[0.04] hover:translate-x-0.5"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );
}

function Logo({ role }: { role: AdminRole }) {
  return (
    <div className="flex items-center gap-3 px-2 pt-2 pb-4">
      <div className="w-8 h-8 rounded-lg grid place-items-center font-extrabold text-[#241a0c] bg-gold-grad shrink-0">
        M
      </div>
      <div className="min-w-0">
        <div className="font-bold text-sm">Matei Systems</div>
        <div className="text-xs text-[#A6A099] truncate">{role === "superadmin" ? "Superadmin" : "Support-Team"}</div>
      </div>
    </div>
  );
}

export default function AdminSidebar({
  role,
  signOutAction,
}: {
  role: AdminRole;
  signOutAction: (formData: FormData) => void | Promise<void>;
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

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-[#0B0A0D]/90 backdrop-blur border-b border-white/[0.07]">
        <Logo role={role} />
        <button aria-label="Menü öffnen" onClick={() => setOpen(true)} className="p-2 -mr-2 text-[#F4F1EC]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 animate-[fadeIn_.2s_ease]" onClick={() => setOpen(false)} />
          <aside className="absolute top-0 left-0 h-full w-[260px] bg-[#0E0E16] border-r border-white/[0.07] p-4 flex flex-col gap-1 enter">
            <div className="flex items-center justify-between mb-2">
              <Logo role={role} />
              <button aria-label="Menü schließen" onClick={() => setOpen(false)} className="p-2 text-[#A6A099]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto pt-3">
              <Link href="/dashboard" className="block px-3 py-2 mb-2 text-xs text-faint hover:text-gold-bright">
                ← Zurück zum Dashboard
              </Link>
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
      <aside className="hidden md:flex flex-col border-r border-white/[0.07] bg-[#0E0E16] p-4 gap-1">
        <Logo role={role} />
        <NavLinks />
        <div className="mt-auto pt-3">
          <Link href="/dashboard" className="block px-3 py-2 mb-2 text-xs text-faint hover:text-gold-bright">
            ← Zurück zum Dashboard
          </Link>
          <form action={signOutAction}>
            <button className="btn btn-ghost w-full text-sm">Abmelden</button>
          </form>
        </div>
      </aside>
    </>
  );
}
