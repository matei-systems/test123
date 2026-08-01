import LegalLayout from "@/components/legal/LegalLayout";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/lib/legal/company-info";

export const metadata = { title: "AGB – Matei Loyalty" };

export default function AgbPage() {
  return (
    <LegalLayout title="Allgemeine Geschäftsbedingungen (AGB)" updated={LEGAL_LAST_UPDATED}>
      <section>
        <h2>1. Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen gelten für sämtliche Verträge zwischen {COMPANY.legalName}{" "}
          ({COMPANY.tradingName}, „Matei Loyalty", „wir") und Unternehmern im Sinne von § 1 UGB („Kunde"), die
          die Plattform Matei Loyalty zur Verwaltung digitaler Treuekarten nutzen. Matei Loyalty richtet sich
          ausschließlich an Unternehmer, nicht an Verbraucher.
        </p>
      </section>

      <section>
        <h2>2. Vertragsgegenstand</h2>
        <p>
          Matei Loyalty stellt eine webbasierte Software-as-a-Service-Plattform bereit, mit der Betriebe
          digitale Stempel- und Punktekarten für ihre Kundschaft erstellen, ausgeben und verwalten können,
          einschließlich der Integration mit Apple Wallet und Google Wallet. Der konkrete Funktionsumfang
          ergibt sich aus dem jeweils gewählten Tarif (siehe {" "}
          <a href="/dashboard/billing">Tarifübersicht</a>).
        </p>
      </section>

      <section>
        <h2>3. Vertragsschluss und Registrierung</h2>
        <p>
          Der Vertrag kommt durch die Registrierung eines Betriebskontos und die Bestätigung dieser AGB sowie
          der Datenschutzerklärung zustande. Der Kunde ist verpflichtet, bei der Registrierung wahrheitsgemäße
          Angaben zu machen und seine Zugangsdaten geheim zu halten.
        </p>
      </section>

      <section>
        <h2>4. Kostenlose Testphase</h2>
        <p>
          Neue Betriebskonten erhalten eine kostenlose, unverbindliche Testphase von 14 Tagen ab Anlage des
          Kontos, ohne dass eine Zahlungsmethode hinterlegt werden muss. Nach Ablauf der Testphase ist die
          Nutzung der Kernfunktionen (z. B. neue Stempel vergeben, Programme anlegen) nur mit einem
          aktiven, kostenpflichtigen Abonnement möglich; bereits gespeicherte Daten bleiben einsehbar.
        </p>
      </section>

      <section>
        <h2>5. Preise und Zahlungsbedingungen</h2>
        <p>
          Es gelten die zum Zeitpunkt des Vertragsschlusses auf der{" "}
          <a href="/dashboard/billing">Tarifseite</a> ausgewiesenen Preise, jeweils zzgl. gesetzlicher
          Umsatzsteuer. Die Zahlungsabwicklung erfolgt über unseren Zahlungsdienstleister Stripe. Abhängig
          vom gewählten Abrechnungsintervall wird das Entgelt monatlich oder jährlich im Voraus fällig.
        </p>
      </section>

      <section>
        <h2>6. Vertragslaufzeit, Tarifwechsel und Kündigung</h2>
        <p>
          Das Abonnement verlängert sich automatisch um die gewählte Abrechnungsperiode (monatlich oder
          jährlich), sofern es nicht vor Ablauf gekündigt wird. Der Kunde kann jederzeit zum Ende der
          laufenden Abrechnungsperiode über das Kunden-Dashboard oder das Stripe-Kundenportal kündigen; bis
          dahin bleibt das Konto uneingeschränkt nutzbar. Ein Wechsel zwischen Tarifen ist jederzeit möglich;
          Preisunterschiede werden anteilig verrechnet (Proration).
        </p>
      </section>

      <section>
        <h2>7. Verfügbarkeit</h2>
        <p>
          Wir bemühen uns um eine möglichst unterbrechungsfreie Verfügbarkeit der Plattform, können jedoch
          keine 100%ige Verfügbarkeit garantieren. Insbesondere Wartungsarbeiten sowie Ausfälle von
          Drittanbietern (Hosting, Zahlungsdienstleister, Apple/Google) liegen außerhalb unseres
          Einflussbereichs.
        </p>
      </section>

      <section>
        <h2>8. Pflichten des Kunden</h2>
        <p>
          Der Kunde ist als datenschutzrechtlich Verantwortlicher für die über Matei Loyalty erhobenen Daten
          seiner eigenen Endkunden (Treueprogramm-Mitglieder) verpflichtet, eine eigene Rechtsgrundlage für
          deren Verarbeitung sicherzustellen. Mit der Anlage eines Betriebskontos akzeptiert der Kunde unseren{" "}
          <a href="/avv">Auftragsverarbeitungsvertrag (AVV)</a>. Der Kunde verpflichtet sich, die Plattform
          nicht missbräuchlich, insbesondere nicht zur Versendung unerwünschter Werbung, zu nutzen.
        </p>
      </section>

      <section>
        <h2>9. Haftung</h2>
        <p>
          Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach Maßgabe des
          Produkthaftungsgesetzes. Für leichte Fahrlässigkeit haften wir nur bei Verletzung wesentlicher
          Vertragspflichten (Kardinalpflichten), begrenzt auf den bei Vertragsschluss vorhersehbaren,
          vertragstypischen Schaden. Im Übrigen ist die Haftung ausgeschlossen. Für Datenverlust haften wir
          nur, soweit dieser durch zumutbare, regelmäßige Datensicherung durch den Kunden vermeidbar gewesen
          wäre.
        </p>
      </section>

      <section>
        <h2>10. Datenschutz</h2>
        <p>
          Für die Verarbeitung personenbezogener Daten gilt unsere{" "}
          <a href="/datenschutz">Datenschutzerklärung</a>. Für die Verarbeitung der Endkundendaten des Kunden
          gilt der in § 8 genannte <a href="/avv">Auftragsverarbeitungsvertrag (AVV)</a>.
        </p>
      </section>

      <section>
        <h2>11. Änderungen dieser AGB</h2>
        <p>
          Wir behalten uns vor, diese AGB mit Wirkung für die Zukunft zu ändern, sofern dies zur Anpassung an
          veränderte rechtliche oder technische Rahmenbedingungen erforderlich ist. Über wesentliche
          Änderungen informieren wir den Kunden rechtzeitig per E-Mail oder im Dashboard.
        </p>
      </section>

      <section>
        <h2>12. Schlussbestimmungen</h2>
        <p>
          Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts und der Verweisungsnormen des
          internationalen Privatrechts. Für alle Streitigkeiten aus diesem Vertrag ist, soweit gesetzlich
          zulässig, das sachlich zuständige Gericht am Sitz des Anbieters ({COMPANY.city}) vereinbart. Sollte
          eine Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen
          unberührt.
        </p>
      </section>
    </LegalLayout>
  );
}
