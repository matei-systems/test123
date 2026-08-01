import LegalLayout from "@/components/legal/LegalLayout";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/lib/legal/company-info";

export const metadata = { title: "Datenschutzerklärung – Matei Loyalty" };

export default function DatenschutzPage() {
  return (
    <LegalLayout title="Datenschutzerklärung" updated={LEGAL_LAST_UPDATED}>
      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          <br />
          {COMPANY.legalName}, {COMPANY.street}, {COMPANY.postalCode} {COMPANY.city}, {COMPANY.country}
          <br />
          E-Mail: {COMPANY.email}
        </p>
      </section>

      <section>
        <h2>2. Zwei Rollen: Matei Loyalty als Anbieter und als Auftragsverarbeiter</h2>
        <p>
          Matei Loyalty ist eine Software-as-a-Service-Plattform für digitale Treuekarten. Dabei verarbeiten wir
          personenbezogene Daten in zwei unterschiedlichen Rollen:
        </p>
        <ul>
          <li>
            Als <strong>Verantwortlicher</strong> für die Daten der Betriebe, die bei uns ein Konto anlegen
            (Kontaktdaten des Inhabers, Team-Mitglieder, Zahlungsdaten) – dazu unten mehr.
          </li>
          <li>
            Als <strong>Auftragsverarbeiter</strong> für die Endkundendaten, die ein Betrieb über seine
            Treuekarten sammelt (Name, optional E-Mail, Stempel-/Punktestand der Kundschaft des Betriebs). Für
            diese Daten ist der jeweilige Betrieb (z. B. das Café, der Friseursalon) datenschutzrechtlich
            verantwortlich; wir verarbeiten sie ausschließlich in dessen Auftrag auf Basis eines
            Auftragsverarbeitungsvertrags (AVV).
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Registrierung und Nutzerkonto</h2>
        <p>
          Bei der Registrierung eines Betriebs erheben wir E-Mail-Adresse und ein verschlüsseltes Passwort.
          Die Authentifizierung erfolgt über unseren Infrastruktur-Anbieter Supabase (Supabase Inc.), der
          Datenbank, Login und Nutzerverwaltung bereitstellt. Rechtsgrundlage ist die Erfüllung des
          Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO).
        </p>
      </section>

      <section>
        <h2>4. Zahlungsabwicklung</h2>
        <p>
          Abo-Zahlungen wickeln wir über den Zahlungsdienstleister Stripe (Stripe Payments Europe, Ltd.) ab.
          Zahlungsdaten (z. B. Kreditkartennummer) werden direkt von Stripe erhoben und verarbeitet – sie
          laufen zu keinem Zeitpunkt über unsere eigenen Server und werden von uns nicht gespeichert. Wir
          erhalten von Stripe lediglich Informationen zum Abo-Status (aktiv, gekündigt, Zahlung fehlgeschlagen)
          sowie Rechnungsdaten. Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Es
          gelten ergänzend die Datenschutzhinweise von Stripe.
        </p>
      </section>

      <section>
        <h2>5. Digitale Wallet-Karten (Apple Wallet, Google Wallet)</h2>
        <p>
          Wenn ein Endkunde seine Treuekarte zu Apple Wallet oder Google Wallet hinzufügt, werden die zur
          Darstellung notwendigen Kartendaten (z. B. Karten-ID, Stempel-/Punktestand, Kartendesign) an Apple
          Inc. bzw. Google LLC übermittelt, damit die Karte auf dem Gerät des Endkunden dargestellt und
          aktualisiert werden kann. Dies geschieht nur, wenn der Endkunde aktiv die Schaltfläche „Zu Apple/
          Google Wallet hinzufügen" nutzt.
        </p>
      </section>

      <section>
        <h2>6. Transaktionale E-Mails</h2>
        <p>
          Für den Versand von System-E-Mails (z. B. Team-Einladungen, Passwort-Zurücksetzen) nutzen wir den
          E-Mail-Dienstleister Resend. Es werden nur die für den jeweiligen Zweck notwendigen Daten
          (E-Mail-Adresse, Inhalt der Nachricht) übermittelt.
        </p>
      </section>

      <section>
        <h2>7. Cookies</h2>
        <p>
          Wir setzen ausschließlich technisch notwendige Cookies ein, um die Anmeldung (Session) aufrecht zu
          erhalten. Diese Cookies fallen unter § 25 Abs. 2 TTDSG bzw. Art. 6 Abs. 1 lit. f DSGVO und bedürfen
          keiner gesonderten Einwilligung. Wir setzen aktuell keine Analyse-, Marketing- oder
          Tracking-Cookies ein.
        </p>
      </section>

      <section>
        <h2>8. Endkundendaten der Treueprogramme</h2>
        <p>
          Wenn sich ein Endkunde bei einem Treueprogramm eines Betriebs anmeldet, erheben wir in dessen
          Auftrag Name, optional E-Mail-Adresse, sowie den Stempel-/Punktestand. Diese Daten werden
          ausschließlich zur Bereitstellung des jeweiligen Treueprogramms verwendet und nicht an Dritte
          weitergegeben (mit Ausnahme der in Abschnitt 5 genannten Übermittlung an Apple/Google bei aktiver
          Wallet-Nutzung durch den Endkunden selbst). Anfragen zu diesen Daten (Auskunft, Löschung) richten
          Endkunden bitte direkt an den jeweiligen Betrieb, bei dem sie Kunde sind.
        </p>
      </section>

      <section>
        <h2>9. Speicherdauer</h2>
        <p>
          Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke erforderlich
          ist oder gesetzliche Aufbewahrungspflichten (z. B. handels- und steuerrechtliche Fristen von bis
          zu 10 Jahren für Rechnungsdaten) bestehen. Nach Kündigung eines Betriebskontos werden die
          zugehörigen Daten nach Ablauf gesetzlicher Aufbewahrungsfristen gelöscht.
        </p>
      </section>

      <section>
        <h2>10. Ihre Rechte</h2>
        <p>Sie haben das Recht auf:</p>
        <ul>
          <li>Auskunft über die zu Ihrer Person gespeicherten Daten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
          <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          <li>Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO)</li>
        </ul>
        <p>Wenden Sie sich dazu an: {COMPANY.email}</p>
      </section>
    </LegalLayout>
  );
}
