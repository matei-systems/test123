import LegalLayout from "@/components/legal/LegalLayout";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/lib/legal/company-info";

export const metadata = { title: "Impressum – Matei Loyalty" };

export default function ImpressumPage() {
  return (
    <LegalLayout title="Impressum" updated={LEGAL_LAST_UPDATED}>
      <section>
        <h2>Angaben gemäß § 5 TMG / § 5 DDG</h2>
        <p>
          {COMPANY.legalName}
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
        <h2>Vertreten durch</h2>
        <p>{COMPANY.representative}</p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          E-Mail: {COMPANY.email}
          <br />
          {COMPANY.phone && COMPANY.phone !== "[Telefonnummer, optional]" ? (
            <>
              Telefon: {COMPANY.phone}
              <br />
            </>
          ) : null}
        </p>
      </section>

      <section>
        <h2>Registereintrag</h2>
        <p>
          Registergericht: {COMPANY.registerCourt}
          <br />
          Registernummer: {COMPANY.registerNumber}
        </p>
        <p className="text-xs text-faint">
          Entfällt, wenn kein Handelsregistereintrag besteht (z. B. bei einem nicht eingetragenen
          Einzelunternehmen) – Abschnitt dann bitte entfernen.
        </p>
      </section>

      <section>
        <h2>Umsatzsteuer-Identifikationsnummer</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
          <br />
          {COMPANY.vatId}
        </p>
        <p className="text-xs text-faint">
          Entfällt, falls keine USt-IdNr. vorhanden ist (z. B. bei Anwendung der Kleinunternehmerregelung nach
          § 19 UStG) – Abschnitt dann bitte entfernen.
        </p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          {COMPANY.contentResponsible}
          <br />
          {COMPANY.street}
          <br />
          {COMPANY.postalCode} {COMPANY.city}
        </p>
      </section>

      <section>
        <h2>Streitschlichtung</h2>
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
