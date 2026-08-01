import LegalLayout from "@/components/legal/LegalLayout";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/lib/legal/company-info";

export const metadata = { title: "Impressum – Matei Loyalty" };

export default function ImpressumPage() {
  return (
    <LegalLayout title="Impressum" updated={LEGAL_LAST_UPDATED}>
      <section>
        <h2>Offenlegung gemäß § 5 ECG und § 25 Mediengesetz</h2>
        <p>
          {COMPANY.legalName}
          {COMPANY.tradingName ? <> (Geschäftsbezeichnung: {COMPANY.tradingName})</> : null}
          <br />
          {COMPANY.legalForm}
          <br />
          {COMPANY.street}
          <br />
          {COMPANY.postalCode} {COMPANY.city}
          <br />
          {COMPANY.country}
        </p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          E-Mail: {COMPANY.email}
          <br />
          Telefon: {COMPANY.phone}
        </p>
      </section>

      <section>
        <h2>Unternehmensgegenstand</h2>
        <p>{COMPANY.businessPurpose}</p>
      </section>

      <section>
        <h2>Kammerzugehörigkeit</h2>
        <p>{COMPANY.chamberMembership}</p>
      </section>

      {COMPANY.registerNumber ? (
        <section>
          <h2>Firmenbuch</h2>
          <p>
            Firmenbuchnummer: {COMPANY.registerNumber}
            <br />
            Firmenbuchgericht: {COMPANY.registerCourt}
          </p>
        </section>
      ) : null}

      {COMPANY.vatId ? (
        <section>
          <h2>UID-Nummer</h2>
          <p>{COMPANY.vatId}</p>
        </section>
      ) : null}

      <section>
        <h2>Anwendbare Rechtsvorschriften</h2>
        <p>
          {COMPANY.applicableLaw}
          <br />
          Gewerbebehörde: {COMPANY.tradeAuthority}
        </p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt</h2>
        <p>{COMPANY.contentResponsible}</p>
      </section>

      <section>
        <h2>EU-Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer">
            https://ec.europa.eu/consumers/odr/
          </a>
          . Unsere E-Mail-Adresse finden Sie oben in diesem Impressum. Wir sind nicht verpflichtet und nicht
          bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>
    </LegalLayout>
  );
}
