import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { COMPANY } from "@/lib/legal/company-info";

const COLUMNS = [
  {
    title: "Plattform",
    links: [
      { href: "/fuer-kunden", label: "Für Kunden" },
      { href: "/fuer-geschaefte", label: "Für Geschäfte" },
      { href: "/geschaefte", label: "Geschäfte entdecken" },
      { href: "/faq", label: "Häufige Fragen" },
    ],
  },
  {
    title: "Matei Systems",
    links: [
      { href: "/kontakt", label: "Kontakt" },
      { href: "/dienstleistungen", label: "Weitere Dienstleistungen" },
      { href: "/login", label: "Anmelden" },
      { href: "/register", label: "Konto erstellen" },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { href: "/impressum", label: "Impressum" },
      { href: "/datenschutz", label: "Datenschutz" },
      { href: "/agb", label: "AGB" },
      { href: "/avv", label: "Auftragsverarbeitung" },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-paper-2/60">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-muted">
            Digitale Treuekarten für lokale Geschäfte. Sammeln, einlösen, wiederkommen – ohne Papierkarte.
          </p>
          <p className="mt-4 font-display text-lg italic text-accent">Treue, die bleibt.</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-semibold text-fg">{col.title}</h2>
            <ul className="mt-3 space-y-1">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-[36px] items-center text-[15px] text-muted transition hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-page flex-col gap-2 px-4 py-5 text-sm text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-8">
          <span>
            © {year} {COMPANY.tradingName} · {COMPANY.legalName}, {COMPANY.city}
          </span>
          <span>
            {COMPANY.street}, {COMPANY.postalCode} {COMPANY.city}, {COMPANY.country}
          </span>
        </div>
      </div>
    </footer>
  );
}
