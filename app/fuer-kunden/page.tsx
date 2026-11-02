import type { Metadata } from "next";
import Link from "next/link";
import PublicShell, { Container, SectionHeading } from "@/components/site/PublicShell";
import { PhoneWalletList, StepRing, TextStamp } from "@/components/site/Illustrations";
import Reveal from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Für Kunden – Treuekarten sammeln und einlösen",
  description:
    "Kostenloses Konto: alle Treuekarten an einem Ort, Punktestand je Geschäft, Verlauf jeder Buchung und Belohnungen per Einmal-Code einlösen.",
};

const WAYS = [
  {
    title: "QR-Code im Geschäft scannen",
    body: "Am Tresen teilnehmender Geschäfte findest du einen QR-Code. Scannen, Namen eingeben – fertig. Mit Konto landet die Karte direkt in deinem Wallet.",
  },
  {
    title: "Im Verzeichnis finden",
    body: "Unter „Geschäfte entdecken“ siehst du alle freigeschalteten Geschäfte mit ihren Belohnungen und kannst dir dort direkt eine Karte holen.",
  },
  {
    title: "Vorhandene Karte verknüpfen",
    body: "Du hast schon eine Karte per Link bekommen? Öffne sie und tippe auf „Mit meinem Konto verknüpfen“ – dein bisheriger Stand bleibt erhalten.",
  },
];

const FEATURES = [
  { title: "Wallet", body: "Alle Karten auf einen Blick – mit getrenntem Stand für jedes Geschäft." },
  { title: "Verlauf", body: "Jeder Stempel, jeder Punkt und jede Einlösung mit Datum und Geschäft." },
  { title: "Belohnungen", body: "Was du dir holen kannst, was es kostet und welche Bedingungen gelten." },
  { title: "Einlöse-Code", body: "Belohnung wählen, Code an der Kasse zeigen – 10 Minuten gültig, nur einmal nutzbar." },
  { title: "Kein Papier", body: "Kein Stempelheft mehr vergessen. Deine Karten sind auf dem Handy, das du sowieso dabei hast." },
  { title: "Deine Daten", body: "Name und E-Mail genügen. Dein Konto kannst du jederzeit selbst löschen." },
];

const RULES = [
  "Stempel und Punkte gelten nur bei dem Geschäft, bei dem du sie gesammelt hast.",
  "Sie haben keinen Barwert und können nicht ausgezahlt oder übertragen werden.",
  "Welche Belohnungen es gibt und welche Bedingungen gelten, legt jedes Geschäft selbst fest – du siehst sie vor dem Einlösen.",
  "Bei Fragen zu einer Buchung hilft dir das Geschäft direkt weiter; jede Buchung ist mit Datum gespeichert.",
];

const FAQ = [
  {
    q: "Kostet mich das etwas?",
    a: "Nein. Das Konto ist kostenlos, und es fallen keine Gebühren an. Du bezahlst im Geschäft ganz normal deinen Einkauf.",
  },
  {
    q: "Brauche ich ein Konto, um Stempel zu sammeln?",
    a: "Nein, eine Karte funktioniert auch ohne Konto über ihren Link. Mit Konto hast du aber alle Karten an einem Ort, siehst deinen Verlauf und kannst Belohnungen per Einlöse-Code einlösen.",
  },
  {
    q: "Was passiert, wenn ich mein Handy verliere?",
    a: "Deine Karten hängen an deinem Konto, nicht am Gerät. Melde dich auf dem neuen Handy an – alles ist wieder da.",
  },
  {
    q: "Funktioniert das mit Apple Wallet oder Google Wallet?",
    a: "Die Anbindung ist in Vorbereitung. Bis dahin öffnest du deine Karten einfach im Browser – auch als App-Symbol auf dem Startbildschirm.",
  },
  {
    q: "Warum kann ich Punkte nicht bei einem anderen Geschäft einlösen?",
    a: "Jedes Geschäft finanziert seine Belohnungen selbst. Deshalb sind Punkte zum Start an das jeweilige Geschäft gebunden.",
  },
];

export default function FuerKundenPage() {
  return (
    <PublicShell>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-0 h-[560px] w-[560px] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgb(var(--forest) / 0.1), transparent 70%)" }}
        />
        <Container className="relative grid items-center gap-12 pb-16 pt-10 md:pb-24 md:pt-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow">Für Kundinnen und Kunden</p>
            <h1 className="mt-4 font-display text-[44px] font-semibold leading-[1.04] sm:text-[60px]">
              Alle Treuekarten. <span className="italic text-accent">Ein Ort.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-muted">
              Sammle bei deinen Lieblingsgeschäften Stempel und Punkte, behalte deinen Stand im Blick und löse Belohnungen mit einem
              Einmal-Code direkt an der Kasse ein.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary btn-lg">
                Kostenlos Konto erstellen
              </Link>
              <Link href="/geschaefte" className="btn btn-ghost btn-lg">
                Geschäfte entdecken
              </Link>
            </div>
            <p className="mt-4 text-sm text-faint">Schon ein Konto? <Link href="/login" className="font-semibold text-accent hover:text-accent-hover">Anmelden</Link></p>
          </div>
          <Reveal variant="scale">
            <PhoneWalletList />
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-line bg-surface/60 py-16 md:py-24">
        <Container>
          <SectionHeading eyebrow="Deine erste Karte" title="So kommst du zu deiner Karte" center />
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {WAYS.map((w, i) => (
              <Reveal key={w.title} delayMs={i * 80}>
                <li className="flex h-full flex-col gap-4">
                  <StepRing n={i + 1} />
                  <h3 className="font-display text-[22px] font-semibold">{w.title}</h3>
                  <p className="text-[16px] leading-relaxed text-muted">{w.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading eyebrow="Dein Konto" title="Alles, was du brauchst – nichts, was nervt." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delayMs={(i % 3) * 70}>
                <div className="card h-full p-6">
                  <h3 className="font-display text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-paper-2/70 py-16 md:py-24">
        <Container className="grid items-start gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="Teilnahme"
              title="Klare Regeln für alle."
              lead="Damit Treueprogramme fair bleiben, gelten auf Matei Systems für alle Geschäfte dieselben Grundregeln."
            />
            <TextStamp size={110} spin={false} className="mt-8 hidden lg:block" />
          </div>
          <ul className="space-y-3">
            {RULES.map((r) => (
              <li key={r} className="card flex gap-3 p-5 text-[16px] leading-relaxed">
                <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-stamp" />
                {r}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading eyebrow="Fragen" title="Häufig gefragt" />
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

      <section className="pb-16 md:pb-24">
        <Container>
          <div className="card flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center md:p-10">
            <div>
              <h2 className="font-display text-3xl font-semibold">Leg los – es dauert eine Minute.</h2>
              <p className="mt-2 text-[16px] text-muted">E-Mail und Passwort genügen. Kostenlos und jederzeit löschbar.</p>
            </div>
            <Link href="/register" className="btn btn-primary btn-lg shrink-0">
              Konto erstellen
            </Link>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
