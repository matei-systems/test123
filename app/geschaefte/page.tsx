import type { Metadata } from "next";
import Link from "next/link";
import PublicShell, { Container } from "@/components/site/PublicShell";
import BusinessCard from "@/components/site/BusinessCard";
import { TextStamp } from "@/components/site/Illustrations";
import { CATEGORIES, listPublicBusinesses, listPublicCities } from "@/lib/directory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Geschäfte entdecken",
  description: "Alle freigeschalteten Geschäfte auf Matei Systems – mit ihren Treueprogrammen, Belohnungen und Bedingungen.",
};

type SP = { q?: string; kategorie?: string; stadt?: string };

function hrefWith(sp: SP, patch: Partial<SP>) {
  const next = { ...sp, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.kategorie) params.set("kategorie", next.kategorie);
  if (next.stadt) params.set("stadt", next.stadt);
  const s = params.toString();
  return s ? `/geschaefte?${s}` : "/geschaefte";
}

export default async function GeschaeftePage({ searchParams }: { searchParams: SP }) {
  const sp: SP = {
    q: (searchParams.q ?? "").trim().slice(0, 60) || undefined,
    kategorie: searchParams.kategorie && searchParams.kategorie in CATEGORIES ? searchParams.kategorie : undefined,
    stadt: (searchParams.stadt ?? "").trim().slice(0, 60) || undefined,
  };
  const filtered = Boolean(sp.q || sp.kategorie || sp.stadt);

  const [result, cities, overall] = await Promise.all([
    listPublicBusinesses({ q: sp.q, category: sp.kategorie, city: sp.stadt }),
    listPublicCities(),
    filtered ? listPublicBusinesses({ limit: 1 }) : Promise.resolve(null),
  ]);
  const overallTotal = overall ? overall.total : result.total;

  return (
    <PublicShell>
      <section className="border-b border-line bg-surface/50">
        <Container className="py-10 md:py-14">
          <p className="eyebrow">Verzeichnis</p>
          <h1 className="mt-3 font-display text-[40px] font-semibold leading-tight sm:text-[52px]">Geschäfte entdecken</h1>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-muted">
            Hier erscheinen nur Geschäfte, deren Profil von uns geprüft und freigeschaltet wurde. Wähle ein Geschäft, um seine
            Belohnungen und Bedingungen zu sehen und dir eine Karte zu holen.
          </p>

          <form action="/geschaefte" method="get" role="search" className="mt-8 grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <div>
              <label htmlFor="q" className="sr-only">Suche</label>
              <input id="q" name="q" type="search" defaultValue={sp.q} placeholder="Name, Stichwort oder Ort" className="input" />
            </div>
            <div>
              <label htmlFor="stadt" className="sr-only">Stadt</label>
              <select id="stadt" name="stadt" defaultValue={sp.stadt ?? ""} className="input" disabled={cities.length === 0}>
                <option value="">Alle Orte</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {sp.kategorie && <input type="hidden" name="kategorie" value={sp.kategorie} />}
            <button type="submit" className="btn btn-dark">
              Suchen
            </button>
          </form>

          <nav aria-label="Kategorien" className="mt-4 flex flex-wrap gap-2">
            <Link href={hrefWith(sp, { kategorie: undefined })} className="chip" aria-current={!sp.kategorie ? "true" : undefined}>
              Alle Kategorien
            </Link>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <Link key={key} href={hrefWith(sp, { kategorie: key })} className="chip" aria-current={sp.kategorie === key ? "true" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
        </Container>
      </section>

      <Container className="py-10 md:py-14">
        {overallTotal === 0 ? (
          <div className="card mx-auto flex max-w-3xl flex-col items-center gap-5 p-8 text-center md:p-12">
            <TextStamp size={110} spin={false} />
            <h2 className="font-display text-3xl font-semibold">Noch keine freigeschalteten Geschäfte</h2>
            <p className="max-w-xl text-[16px] leading-relaxed text-muted">
              Die ersten Partnergeschäfte werden gerade geprüft. Sobald sie freigeschaltet sind, erscheinen sie hier mit ihren
              Belohnungen. Du hast schon eine Karte von einem Geschäft? Die funktioniert unabhängig davon.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/fuer-geschaefte" className="btn btn-primary">
                Eigenes Geschäft anmelden
              </Link>
              <Link href="/fuer-kunden" className="btn btn-ghost">
                So funktioniert’s für Kunden
              </Link>
            </div>
          </div>
        ) : result.businesses.length === 0 ? (
          <div className="card mx-auto max-w-2xl p-8 text-center">
            <h2 className="font-display text-2xl font-semibold">Keine Treffer</h2>
            <p className="mt-2 text-muted">Für diese Suche haben wir kein freigeschaltetes Geschäft gefunden.</p>
            <Link href="/geschaefte" className="btn btn-ghost mt-6">
              Filter zurücksetzen
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted" aria-live="polite">
              {result.total} {result.total === 1 ? "Geschäft" : "Geschäfte"}
              {filtered ? " gefunden" : ""}
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.businesses.map((b) => (
                <BusinessCard key={b.org_id} b={b} />
              ))}
            </div>
          </>
        )}
      </Container>
    </PublicShell>
  );
}
