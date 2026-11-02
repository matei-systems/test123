import type { Metadata } from "next";
import Link from "next/link";
import PublicShell, { Container } from "@/components/site/PublicShell";

export const metadata: Metadata = {
  title: "Häufige Fragen",
  description: "Antworten für Kundinnen, Kunden und Geschäfte: Kosten, Einlösen, Punkte, Prüfung, Team, Sicherheit und Datenschutz.",
};

type QA = { q: string; a: React.ReactNode };

const GROUPS: { id: string; title: string; items: QA[] }[] = [
  {
    id: "kunden",
    title: "Für Kundinnen und Kunden",
    items: [
      { q: "Was ist Matei Systems?", a: "Eine Plattform für digitale Treuekarten lokaler Geschäfte. Du sammelst Stempel oder Punkte auf dem Handy und löst sie beim jeweiligen Geschäft gegen dessen Belohnungen ein." },
      { q: "Kostet mich das etwas?", a: "Nein. Konto und Karten sind kostenlos. Geschäfte bezahlen für ihr Treueprogramm." },
      { q: "Brauche ich eine App?", a: "Nein. Alles läuft im Browser deines Handys. Die Anbindung an Apple Wallet und Google Wallet ist in Vorbereitung." },
      { q: "Brauche ich ein Konto?", a: "Für eine einzelne Karte nicht – sie funktioniert über ihren Link. Mit einem Konto siehst du aber alle Karten an einem Ort, deinen Verlauf, und du kannst Belohnungen per Einlöse-Code einlösen." },
      {
        q: "Wie löse ich eine Belohnung ein?",
        a: "Öffne in deinem Konto die Karte, wähle eine freigeschaltete Belohnung und tippe auf „Einlöse-Code anzeigen“. Das Geschäft scannt den QR-Code oder tippt den 6-stelligen Code ein. Der Code gilt 10 Minuten und nur ein einziges Mal. Alternativ kann das Geschäft die Belohnung auch direkt beim Scannen deiner Karte einlösen.",
      },
      { q: "Kann ich Punkte bei einem anderen Geschäft einlösen?", a: "Nein. Zum Start sind Stempel, Punkte und Belohnungen an das Geschäft gebunden, bei dem du sie gesammelt hast. Sie haben keinen Barwert und sind nicht übertragbar." },
      { q: "Mir fehlt ein Stempel – was tun?", a: "Jede Buchung steht mit Datum in deinem Verlauf. Sprich das Geschäft direkt an; nur das Geschäft kann Stempel oder Punkte vergeben." },
      { q: "Ich habe schon eine Karte ohne Konto – geht die verloren?", a: "Nein. Öffne die Karte über ihren Link, während du angemeldet bist, und tippe auf „Mit meinem Konto verknüpfen“. Dein Stand bleibt erhalten." },
      { q: "Wie lösche ich mein Konto?", a: <>Unter <Link href="/konto/profil" className="font-semibold text-accent">Konto → Profil</Link> kannst du dein Konto selbst löschen. Deine Karten werden dabei vom Konto getrennt; die Buchungen bleiben beim Geschäft als dessen Aufzeichnungen bestehen.</> },
    ],
  },
  {
    id: "geschaefte",
    title: "Für Geschäfte",
    items: [
      { q: "Was kostet Matei Systems für mein Geschäft?", a: <>Die Tarife findest du unter <Link href="/fuer-geschaefte#preise" className="font-semibold text-accent">Für Geschäfte → Preise</Link>. Du kannst 14 Tage kostenlos testen, ohne Zahlungsdaten anzugeben.</> },
      { q: "Brauche ich zusätzliche Hardware?", a: "Nein. Zum Scannen genügt ein Handy oder Tablet mit Kamera und Browser. Eine Kassenanbindung ist nicht nötig." },
      { q: "Wie vergebe ich Stempel oder Punkte?", a: "Im Dashboard unter „Scannen“ die Kundenkarte scannen und vergeben – auf Wunsch nach Einkaufsbetrag. Ein Doppel-Scan derselben Karte innerhalb von 30 Sekunden wird automatisch verhindert." },
      { q: "Kann ich eigene Belohnungen und Aktionen anlegen?", a: "Ja. Pro Programm beliebig viele Belohnungen mit eigenen Kosten, Bedingungen und Gültigkeit – jederzeit pausieren oder beenden. Dazu Aktionen wie doppelte Punkte für einen Zeitraum." },
      { q: "Wie komme ich ins Verzeichnis?", a: "Fülle dein Geschäftsprofil aus (Beschreibung, Kategorie, Ort) und reiche es zur Prüfung ein. Nach der Freischaltung durch Matei Systems erscheinst du unter „Geschäfte entdecken“. Den Status siehst du jederzeit im Dashboard." },
      { q: "Kann mein Team mitarbeiten?", a: "Ja. Es gibt die Rollen Inhaber, Admin und Mitarbeiter. Mitarbeiter können scannen und Karten ausgeben, aber keine Belohnungen, Programmregeln oder das Profil ändern." },
      { q: "Was passiert nach der Testphase?", a: "Du wählst einen Tarif. Ohne aktives Abo bleiben alle Daten lesbar, das Vergeben und Einlösen ist aber pausiert, bis das Abo aktiv ist." },
    ],
  },
  {
    id: "sicherheit",
    title: "Sicherheit & Datenschutz",
    items: [
      { q: "Wie wird Missbrauch verhindert?", a: "Stempel, Punkte und Einlösungen werden ausschließlich auf dem Server geprüft und gebucht – mit Sperre gegen gleichzeitige Doppelbuchungen. Einlöse-Codes sind kurzlebig und einmalig. Auffällige Muster (z. B. sehr viele Buchungen in kurzer Zeit) werden automatisch markiert und vom Plattform-Team geprüft." },
      { q: "Wer sieht meine Daten?", a: "Ein Geschäft sieht nur Kundinnen und Kunden, die bei ihm eine Karte haben, und nur deren Karten bei diesem Geschäft. Andere Geschäfte sehen nichts davon." },
      { q: "Wo werden die Daten gespeichert?", a: <>In einer Datenbank in der EU (Paris). Details stehen in der <Link href="/datenschutz" className="font-semibold text-accent">Datenschutzerklärung</Link>.</> },
    ],
  },
];

export default function FaqPage() {
  return (
    <PublicShell>
      <Container className="py-12 md:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Hilfe</p>
          <h1 className="mt-3 font-display text-[40px] font-semibold leading-tight sm:text-[52px]">Häufige Fragen</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">
            Deine Frage ist nicht dabei? <Link href="/kontakt" className="font-semibold text-accent hover:text-accent-hover">Schreib uns</Link> – wir melden uns so schnell wie möglich.
          </p>
          <nav aria-label="Themen" className="mt-6 flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="chip">
                {g.title}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-12 space-y-14">
          {GROUPS.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="scroll-mt-24">
              <h2 id={`${g.id}-h`} className="font-display text-[28px] font-semibold">
                {g.title}
              </h2>
              <div className="mt-5 divide-y divide-line rounded-card border border-line bg-surface">
                {g.items.map((f) => (
                  <details key={f.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[17px] font-semibold">
                      {f.q}
                      <span aria-hidden="true" className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <div className="mt-3 max-w-3xl text-[16px] leading-relaxed text-muted">{f.a}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </PublicShell>
  );
}
