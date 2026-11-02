import LegalLayout from "@/components/legal/LegalLayout";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/lib/legal/company-info";

export const metadata = { title: "Datenschutzerklärung" };

export default function DatenschutzPage() {
  return (
    <LegalLayout title="Datenschutzerklärung" updated={LEGAL_LAST_UPDATED}>
      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          <br />
          {COMPANY.legalName} ({COMPANY.tradingName}), {COMPANY.street}, {COMPANY.postalCode} {COMPANY.city},{" "}
          {COMPANY.country}
          <br />
          E-Mail: {COMPANY.email} · Telefon: {COMPANY.phone}
        </p>
      </section>

      <section>
        <h2>2. Zwei Rollen: Matei Systems als Anbieter und als Auftragsverarbeiter</h2>
        <p>
          Matei Systems ist eine Plattform für digitale Treuekarten lokaler Geschäfte. Dabei verarbeiten wir
          personenbezogene Daten in zwei unterschiedlichen Rollen:
        </p>
        <ul>
          <li>
            Als <strong>Verantwortlicher</strong> für die Daten der Betriebe, die bei uns ein Konto anlegen
            (Kontaktdaten des Inhabers, Team-Mitglieder, Zahlungsdaten), sowie für die Kundenkonten von
            Endkundinnen und Endkunden (Abschnitt 8a), das Kontaktformular und Meldungen – dazu unten mehr.
          </li>
          <li>
            Als <strong>Auftragsverarbeiter</strong> für die Endkundendaten, die ein Betrieb über seine
            Treuekarten sammelt (Name, optional E-Mail, Stempel-/Punktestand der Kundschaft des Betriebs). Für
            diese Daten ist der jeweilige Betrieb (z. B. das Café, der Friseursalon) datenschutzrechtlich
            verantwortlich; wir verarbeiten sie ausschließlich in dessen Auftrag auf Basis unseres{" "}
            <a href="/avv">Auftragsverarbeitungsvertrags (AVV)</a>, den jeder Betrieb bei der Kontoanlage
            akzeptiert.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Registrierung, Nutzerkonto und Hosting</h2>
        <p>
          Bei der Registrierung (Betrieb oder Kundin/Kunde) erheben wir E-Mail-Adresse, optional den Namen
          und ein verschlüsselt gespeichertes Passwort sowie den Zeitpunkt der Zustimmung zu AGB und
          Datenschutzerklärung. Die Authentifizierung erfolgt über unseren Infrastruktur-Anbieter Supabase
          (Supabase Inc.), der Datenbank, Login und Nutzerverwaltung bereitstellt; die Datenbank befindet sich
          in der EU (Paris). Die Website wird über Vercel Inc. ausgeliefert; dabei fallen technisch notwendige
          Server-Protokolle (z. B. IP-Adresse, Zeitpunkt, aufgerufene Seite) an. Rechtsgrundlage ist die
          Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO) bzw. unser berechtigtes Interesse am
          sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO).
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
          Wir setzen ausschließlich technisch notwendige Cookies ein: zur Aufrechterhaltung der Anmeldung
          (Session) und – wenn du ohne Konto eine Treuekarte erstellst – ein Cookie, das die auf diesem Gerät
          erstellten Karten wiedererkennt, damit keine doppelten Karten entstehen. Die Wahl zwischen hellem und
          dunklem Design wird nur lokal im Browser gespeichert. Diese Speicherungen fallen unter § 165 Abs. 3
          TKG 2021 bzw. Art. 6 Abs. 1 lit. f DSGVO und bedürfen keiner gesonderten Einwilligung. Wir setzen
          keine Analyse-, Marketing- oder Tracking-Cookies ein.
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
        <h2>8a. Kundenkonten für Endkundinnen und Endkunden</h2>
        <p>
          Mit einem kostenlosen Kundenkonto kannst du Treuekarten verschiedener Geschäfte an einem Ort
          verwalten. Dafür verarbeiten wir als Verantwortliche: deine Kontodaten (E-Mail, Name, Passwort), die
          Zuordnung deiner Karten zu deinem Konto, die Buchungen auf diesen Karten zur Anzeige in deinem
          Verlauf sowie Einlöse-Codes (10 Minuten gültig). Rechtsgrundlage ist die Vertragserfüllung (Art. 6
          Abs. 1 lit. b DSGVO).
        </p>
        <p>
          Holst du dir mit deinem Konto eine Karte bei einem Geschäft, erhält dieses Geschäft deinen Namen als
          Kundendatensatz, nicht aber deine E-Mail-Adresse. Ein Geschäft sieht nur die Karten und Buchungen bei
          ihm selbst, nie deine Karten bei anderen Geschäften.
        </p>
        <p>
          Unter „Konto → Profil“ kannst du jederzeit alle deinem Konto zugeordneten Daten herunterladen (Art. 15,
          20 DSGVO) und dein Konto selbst löschen (Art. 17 DSGVO). Beim Löschen werden Konto, Profil und offene
          Einlöse-Codes gelöscht und deine Karten vom Konto getrennt; die Kundendatensätze und Buchungen bei
          den Geschäften bleiben als deren Aufzeichnungen bestehen (siehe Abschnitt 8) und können dort gelöscht
          werden.
        </p>
      </section>

      <section>
        <h2>8b. Geschäftsverzeichnis, Kontaktformular und Meldungen</h2>
        <p>
          Geschäfte können ein öffentliches Profil (z. B. Name, Beschreibung, Adresse, Öffnungszeiten,
          Kontaktdaten) veröffentlichen; die Angaben stammen vom jeweiligen Geschäft und erscheinen erst nach
          unserer Prüfung. Anfragen über das Kontaktformular (Name, E-Mail, Nachricht) und Meldungen von
          Profilen (Grund, Nachricht, optional E-Mail) speichern wir zur Bearbeitung (Art. 6 Abs. 1 lit. b
          bzw. f DSGVO) und löschen sie, wenn sie nicht mehr benötigt werden.
        </p>
      </section>

      <section>
        <h2>8c. Missbrauchsschutz</h2>
        <p>
          Zum Schutz vor Missbrauch begrenzen wir die Zahl bestimmter Anfragen je IP-Adresse (z. B. Anmeldung,
          Registrierung, Kontaktformular) und markieren auffällige Buchungsmuster (z. B. sehr viele Stempel auf
          einer Karte in kurzer Zeit) automatisch zur Prüfung durch unser Team. Es erfolgt keine automatisierte
          Entscheidung mit rechtlicher Wirkung; jede Markierung wird von einem Menschen geprüft. Rechtsgrundlage
          ist unser berechtigtes Interesse an einer fairen und sicheren Plattform (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
      </section>

      <section>
        <h2>9. Speicherdauer</h2>
        <p>
          Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke erforderlich
          ist oder gesetzliche Aufbewahrungspflichten bestehen (insbesondere unternehmens- und
          abgabenrechtliche Aufbewahrungsfristen von bis zu 7 Jahren für Rechnungsdaten gemäß § 132 BAO
          und § 212 UGB). Nach Kündigung eines Betriebskontos werden die zugehörigen Daten nach Ablauf
          gesetzlicher Aufbewahrungsfristen gelöscht.
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
          <li>Beschwerde bei der Datenschutzbehörde (Art. 77 DSGVO)</li>
        </ul>
        <p>Für Anfragen zu Ihren Daten wenden Sie sich an: {COMPANY.email}</p>
        <p>
          Zuständige Aufsichtsbehörde in Österreich:
          <br />
          Österreichische Datenschutzbehörde (DSB)
          <br />
          Barichgasse 40-42, 1030 Wien
          <br />
          <a href="https://www.dsb.gv.at" target="_blank" rel="noreferrer">
            www.dsb.gv.at
          </a>
        </p>
      </section>
    </LegalLayout>
  );
}
