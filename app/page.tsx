import Link from "next/link";
import PublicShell, { Container, SectionHeading } from "@/components/site/PublicShell";
import { PhoneStampCard, StepRing, TextStamp } from "@/components/site/Illustrations";
import BusinessCard from "@/components/site/BusinessCard";
import Reveal from "@/components/marketing/Reveal";
import { listPublicBusinesses } from "@/lib/directory";

export const revalidate = 60;

const STEPS = [
  {
    title: "Karte holen",
    body: "Scanne im Geschäft den QR-Code am Tresen. Deine Karte ist sofort auf dem Handy – ohne App, ohne Papier.",
  },
  {
    title: "Sammeln",
    body: "Bei jedem Einkauf vergibt das Geschäft Stempel oder Punkte. Dein Stand ist sofort aktuell – für jedes Geschäft getrennt.",
  },
  {
    title: "Einlösen",
    body: "Belohnung erreicht? Zeig an der Kasse deinen Einlöse-Code. Er gilt 10 Minuten und nur ein einziges Mal.",
  },
];

const FOR_CUSTOMERS = [
  "Alle Treuekarten in einem Konto statt im Portemonnaie",
  "Punktestand und Verlauf jederzeit einsehen",
  "Belohnungen und ihre Bedingungen auf einen Blick",
  "Kostenlos – du zahlst nur, was du im Geschäft kaufst",
];

const FOR_BUSINESSES = [
  "Eigenes Stempel- oder Punkteprogramm in wenigen Minuten",
  "Scannen mit jedem Handy – keine Kassenanbindung nötig",
  "Belohnungen und Aktionen selbst anlegen, pausieren, beenden",
  "Überblick über Kunden, Buchungen und Einlösungen",
];

const TRUST = [
  {
    title: "Auf dem Server geprüft",
    body: "Jeder Stempel und jede Einlösung wird von unserem Server geprüft und als Buchung protokolliert – nicht vom Handy.",
  },
  {
    title: "Einmal-Codes",
    body: "Einlöse-Codes sind 10 Minuten gültig und nur ein einziges Mal verwendbar. Doppelte Einlösungen sind ausgeschlossen.",
  },
  {
    title: "Getrennte Daten",
    body: "Ein Geschäft sieht nur die Karten, die bei ihm gesammelt wurden – nie deine Karten bei anderen Geschäften.",
  },
  {
    title: "Datenbank in der EU",
    body: "Konten, Karten und Buchungen liegen in einer Datenbank in der EU (Paris) und werden verschlüsselt übertragen.",
  },
];

const FAQ = [
  {
    q: "Was kostet Matei Systems für Kundinnen und Kunden?",
    a: "Nichts. Das Konto und alle Treuekarten sind kostenlos. Geschäfte zahlen für ihr Treueprogramm, nicht du.",
  },
  {
    q: "Brauche ich eine App?",
    a: "Nein. Deine Karten öffnen sich im Browser deines Handys. Die Anbindung an Apple Wallet und Google Wallet ist in Vorbereitung.",
  },
  {
    q: "Kann ich Punkte von einem Geschäft bei einem anderen einlösen?",
    a: "Nein, zum Start sind Punkte und Belohnungen immer an das Geschäft gebunden, bei dem du sie gesammelt hast. So bleibt jedes Programm fair und klar.",
  },
  {
    q: "Wie kommt mein Geschäft auf die Plattform?",
    a: "Registriere dein Geschäft, lege dein Programm an und reiche dein Profil zur Prüfung ein. Nach der Freischaltung erscheinst du im Verzeichnis.",
  },
];

export default async function Home() {
  const { businesses, total } = await listPublicBusinesses({ limit: 6 });

  return (
    <PublicShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgb(var(--accent-strong) / 0.12), transparent 70%)" }}
        />
        <Container className="relative grid items-center gap-12 pb-16 pt-10 md:pb-24 md:pt-16 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="eyebrow">Digitale Treuekarten für lokale Geschäfte</p>
            <h1 className="mt-4 font-display text-[46px] font-semibold leading-[1.02] sm:text-[64px] lg:text-[72px]">
              Treue, die <span className="italic text-accent">bleibt.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-muted sm:text-[19px]">
              Sammle Stempel und Punkte bei Geschäften in deiner Nähe und löse sie direkt dort gegen echte Belohnungen ein –
              ohne Papierkarte und ohne App-Download.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link href="/fuer-kunden" className="card card-hover group flex flex-col gap-2 p-5">
                <span className="badge badge-forest w-fit">Für Kunden</span>
                <span className="font-display text-xl font-semibold leading-snug">Karten sammeln & einlösen</span>
                <span className="text-[15px] text-muted">Kostenloses Konto, alle Karten an einem Ort.</span>
                <span className="mt-1 text-sm font-semibold text-accent">
                  So funktioniert’s <span aria-hidden="true">→</span>
                </span>
              </Link>
              <Link href="/fuer-geschaefte" className="card card-hover group flex flex-col gap-2 p-5">
                <span className="badge badge-accent w-fit">Für Geschäfte</span>
                <span className="font-display text-xl font-semibold leading-snug">Treueprogramm starten</span>
                <span className="text-[15px] text-muted">In wenigen Minuten eingerichtet, 14 Tage kostenlos testen.</span>
                <span className="mt-1 text-sm font-semibold text-accent">
                  Mehr erfahren <span aria-hidden="true">→</span>
                </span>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/register" className="btn btn-primary btn-lg">
                Kostenlos Konto erstellen
              </Link>
              <Link href="/geschaefte" className="btn btn-ghost btn-lg">
                Geschäfte entdecken
              </Link>
            </div>
          </div>

          <div className="relative">
            <Reveal variant="scale">
              <PhoneStampCard />
            </Reveal>
            <TextStamp className="absolute -left-6 -bottom-8 hidden lg:block xl:-left-12" size={124} />
          </div>
        </Container>
      </section>

      {/* SO FUNKTIONIERT'S */}
      <section className="border-y border-line bg-surface/60 py-16 md:py-24" aria-labelledby="ablauf">
        <Container>
          <div id="ablauf">
            <SectionHeading eyebrow="So funktioniert’s" title="Drei Schritte, mehr nicht." center />
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delayMs={i * 90}>
                <li className="flex h-full flex-col gap-4 rounded-card p-2 md:items-center md:text-center">
                  <StepRing n={i + 1} />
                  <h3 className="font-display text-[22px] font-semibold">{s.title}</h3>
                  <p className="text-[16px] leading-relaxed text-muted">{s.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* FÜR BEIDE SEITEN */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading eyebrow="Für beide Seiten gemacht" title="Einfach für Kunden. Wirksam für Geschäfte." />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              { label: "Für Kunden", items: FOR_CUSTOMERS, href: "/fuer-kunden", cta: "Mehr für Kunden", tone: "forest" },
              { label: "Für Geschäfte", items: FOR_BUSINESSES, href: "/fuer-geschaefte", cta: "Mehr für Geschäfte", tone: "accent" },
            ].map((col) => (
              <Reveal key={col.label}>
                <div className="card flex h-full flex-col p-6 md:p-8">
                  <span className={`badge w-fit ${col.tone === "forest" ? "badge-forest" : "badge-accent"}`}>{col.label}</span>
                  <ul className="mt-5 space-y-3">
                    {col.items.map((item) => (
                      <li key={item} className="flex gap-3 text-[16px] leading-relaxed">
                        <svg viewBox="0 0 24 24" className={`mt-1 h-5 w-5 shrink-0 ${col.tone === "forest" ? "text-forest" : "text-accent"}`} fill="none" stroke="currentColor" strokeWidth={2.6} aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link href={col.href} className="mt-6 inline-flex w-fit items-center gap-1 text-[15px] font-semibold text-accent hover:text-accent-hover">
                    {col.cta} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* TEILNEHMENDE GESCHÄFTE - nur echte, freigeschaltete Daten */}
      <section className="bg-paper-2/70 py-16 md:py-24" aria-labelledby="partner">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div id="partner">
              <SectionHeading eyebrow="Teilnehmende Geschäfte" title="Hier kannst du sammeln" />
            </div>
            {total > 0 && (
              <Link href="/geschaefte" className="btn btn-ghost">
                Alle {total} Geschäfte ansehen
              </Link>
            )}
          </div>
          {businesses.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((b) => (
                <BusinessCard key={b.org_id} b={b} />
              ))}
            </div>
          ) : (
            <div className="card mt-10 flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:p-8">
              <TextStamp size={92} spin={false} className="shrink-0" />
              <div className="flex-1">
                <h3 className="font-display text-2xl font-semibold">Die ersten Partnergeschäfte werden gerade freigeschaltet.</h3>
                <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-muted">
                  Wir prüfen jedes Geschäftsprofil, bevor es hier erscheint. Sobald die ersten Geschäfte freigeschaltet sind, findest du
                  sie an dieser Stelle – mit ihren Belohnungen und Bedingungen.
                </p>
              </div>
              <Link href="/fuer-geschaefte" className="btn btn-primary shrink-0">
                Eigenes Geschäft anmelden
              </Link>
            </div>
          )}
        </Container>
      </section>

      {/* FAIR & SICHER */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading
            eyebrow="Fair & sicher"
            title="Vertrauen ist der Kern jeder Treuekarte."
            lead="Darum laufen alle Buchungen über geprüfte Funktionen auf unserem Server – nachvollziehbar für Kunden und Geschäfte."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t, i) => (
              <Reveal key={t.title} delayMs={i * 70}>
                <div className="card-flat h-full p-5">
                  <h3 className="font-display text-lg font-semibold">{t.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{t.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-t border-line py-16 md:py-24" aria-labelledby="faq-kurz">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div id="faq-kurz">
            <SectionHeading eyebrow="Häufige Fragen" title="Kurz beantwortet." lead="Weitere Antworten für Kunden und Geschäfte findest du in den FAQ." />
            <Link href="/faq" className="btn btn-ghost mt-6">
              Alle Fragen ansehen
            </Link>
          </div>
          <div className="divide-y divide-line rounded-card border border-line bg-surface">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[17px] font-semibold">
                  {f.q}
                  <span aria-hidden="true" className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[16px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-16 md:pb-24">
        <Container>
          <div className="relative overflow-hidden rounded-[28px] bg-[#14110F] px-6 py-12 text-[#F5EFE6] dark:border dark:border-line-2 dark:bg-surface md:px-14 md:py-16">
            <TextStamp size={160} className="absolute -right-6 -top-6 opacity-60" />
            <h2 className="max-w-2xl font-display text-[34px] font-semibold leading-tight sm:text-[44px]">
              Bereit für <span className="italic text-[#E0A458]">Treue, die bleibt?</span>
            </h2>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-[#B3A898]">
              Erstelle dein kostenloses Konto als Kundin oder Kunde – oder starte das Treueprogramm für dein Geschäft.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-lg bg-[#E0A458] text-[#14110F] hover:bg-[#F0BE7E]">
                Konto erstellen
              </Link>
              <Link href="/register?typ=geschaeft" className="btn btn-lg border-[#F5EFE6]/30 text-[#F5EFE6] hover:border-[#E0A458] hover:text-[#E0A458]">
                Geschäft registrieren
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
