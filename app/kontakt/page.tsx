import type { Metadata } from "next";
import Link from "next/link";
import PublicShell, { Container } from "@/components/site/PublicShell";
import SubmitButton from "@/components/SubmitButton";
import { COMPANY } from "@/lib/legal/company-info";
import { sendContactMessage } from "./actions";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Fragen zu Matei Systems? Schreib uns – für Kundinnen, Kunden, Geschäfte und Presse.",
};

export default function KontaktPage({ searchParams }: { searchParams: { gesendet?: string; fehler?: string; thema?: string } }) {
  const sent = searchParams.gesendet === "1";
  const topic = ["kunde", "geschaeft", "presse", "sonstiges"].includes(searchParams.thema ?? "") ? searchParams.thema : "kunde";

  return (
    <PublicShell>
      <Container className="grid gap-12 py-12 md:py-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">Kontakt</p>
          <h1 className="mt-3 font-display text-[40px] font-semibold leading-tight sm:text-[52px]">Wie können wir helfen?</h1>
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted">
            Frage zu deiner Karte, zum Treueprogramm für dein Geschäft oder etwas ganz anderes – schreib uns, wir melden uns so
            schnell wie möglich per E-Mail.
          </p>
          <div className="mt-8 space-y-3">
            <a href={`mailto:${COMPANY.email}`} className="card card-hover flex items-center gap-4 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-strong/10 text-accent" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
              </span>
              <span>
                <span className="block text-sm text-muted">E-Mail</span>
                <span className="font-semibold">{COMPANY.email}</span>
              </span>
            </a>
            <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="card card-hover flex items-center gap-4 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-strong/10 text-accent" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></svg>
              </span>
              <span>
                <span className="block text-sm text-muted">Telefon</span>
                <span className="font-semibold">{COMPANY.phone}</span>
              </span>
            </a>
          </div>
          <p className="mt-6 text-sm text-faint">
            {COMPANY.tradingName} · {COMPANY.legalName} · {COMPANY.street}, {COMPANY.postalCode} {COMPANY.city}. Weitere Angaben im{" "}
            <Link href="/impressum" className="underline underline-offset-2 hover:text-accent">Impressum</Link>.
          </p>
        </div>

        <div className="card p-6 md:p-8">
          {sent ? (
            <div role="status" className="py-8 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-forest text-on-forest" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              <h2 className="mt-5 font-display text-2xl font-semibold">Danke für deine Nachricht!</h2>
              <p className="mx-auto mt-2 max-w-sm text-muted">Wir haben sie erhalten und melden uns per E-Mail bei dir.</p>
              <Link href="/" className="btn btn-ghost mt-6">Zur Startseite</Link>
            </div>
          ) : (
            <form action={sendContactMessage} className="space-y-5" noValidate>
              <h2 className="font-display text-2xl font-semibold">Nachricht schreiben</h2>
              {searchParams.fehler && (
                <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                  {searchParams.fehler}
                </p>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="label">Name</label>
                  <input id="name" name="name" className="input" autoComplete="name" required minLength={2} maxLength={120} />
                </div>
                <div>
                  <label htmlFor="email" className="label">E-Mail</label>
                  <input id="email" name="email" type="email" className="input" autoComplete="email" required />
                </div>
              </div>
              <div>
                <label htmlFor="topic" className="label">Thema</label>
                <select id="topic" name="topic" className="input" defaultValue={topic}>
                  <option value="kunde">Ich bin Kundin / Kunde</option>
                  <option value="geschaeft">Ich habe ein Geschäft</option>
                  <option value="presse">Presse & Kooperation</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="label">Nachricht</label>
                <textarea id="message" name="message" className="input min-h-[160px]" required minLength={10} maxLength={4000} />
                <p className="hint">Bitte keine Passwörter oder Zahlungsdaten senden.</p>
              </div>
              {/* Honeypot: für Menschen unsichtbar */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="website">Website</label>
                <input id="website" name="website" tabIndex={-1} autoComplete="off" />
              </div>
              <p className="text-sm text-faint">
                Wir verwenden deine Angaben nur zur Beantwortung deiner Anfrage. Mehr in der{" "}
                <Link href="/datenschutz" className="underline underline-offset-2 hover:text-accent">Datenschutzerklärung</Link>.
              </p>
              <SubmitButton className="btn btn-primary w-full sm:w-auto" pendingText="Wird gesendet …">
                Nachricht senden
              </SubmitButton>
            </form>
          )}
        </div>
      </Container>
    </PublicShell>
  );
}
