"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";

const TABS = [
  {
    href: "/konto",
    label: "Wallet",
    icon: <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 3h18M16 14h2" />,
  },
  {
    href: "/geschaefte",
    label: "Entdecken",
    icon: <path d="M12 21s-7-5.4-7-11a7 7 0 1 1 14 0c0 5.6-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  },
  { href: "/konto/verlauf", label: "Verlauf", icon: <path d="M12 7v5l3 2M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" /> },
  {
    href: "/konto/profil",
    label: "Profil",
    icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" />,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/konto") return pathname === "/konto" || pathname.startsWith("/konto/karten") || pathname.startsWith("/konto/einloesen");
  return pathname === href || pathname.startsWith(href + "/");
}

export function KontoHeader({
  email,
  isBusiness,
  isAdmin,
  signOutAction,
}: {
  email: string;
  isBusiness: boolean;
  isAdmin: boolean;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 sm:px-6 md:px-8">
        <Logo href="/konto" label="Zum Wallet" />
        <nav aria-label="Kundenbereich" className="hidden items-center gap-1 md:flex">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={isActive(pathname, t.href) ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-[15px] font-medium transition ${
                isActive(pathname, t.href) ? "bg-fg/[0.06] text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin" className="btn btn-soft btn-sm hidden sm:inline-flex">
              Admin
            </Link>
          )}
          {isBusiness && (
            <Link href="/dashboard" className="btn btn-soft btn-sm hidden sm:inline-flex">
              Mein Geschäft
            </Link>
          )}
          <ThemeToggle />
          <form action={signOutAction} className="hidden md:block">
            <button type="submit" className="btn btn-ghost btn-sm" title={`Abmelden (${email})`}>
              Abmelden
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

export function KontoTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Kundenbereich mobil"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? "text-accent" : "text-faint"}`}
              >
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {t.icon}
                </svg>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
