import LegalLayout from "@/components/legal/LegalLayout";
import PrintButton from "@/components/join/PrintButton";
import { COMPANY, LEGAL_LAST_UPDATED, AVV_VERSION } from "@/lib/legal/company-info";

export const metadata = { title: "Auftragsverarbeitungsvertrag (AVV) – Matei Loyalty" };

export default function AvvPage() {
  return (
    <LegalLayout title="Auftragsverarbeitungsvertrag (AVV)" updated={LEGAL_LAST_UPDATED}>
      <p className="text-xs text-faint">Version {AVV_VERSION} · gemäß Art. 28 DSGVO</p>

      <section>
        <h2>Präambel</h2>
        <p>
          Dieser Auftragsverarbeitungsvertrag (AVV) regelt die Rechte und Pflichten von {COMPANY.legalName} (
          {COMPANY.tradingName}, {COMPANY.street}, {COMPANY.postalCode} {COMPANY.city}, {COMPANY.country}; im
          Folgenden „Auftragsverarbeiter") und dem jeweiligen Betrieb, der ein Konto auf der Plattform Matei
          Loyalty anlegt (im Folgenden „Auftraggeber" oder „Verantwortlicher"), bei der Verarbeitung
          personenbezogener Daten der Endkunden des Auftraggebers im Rahmen der Nutzung der Plattform. Dieser
          AVV wird mit Anlage eines Betriebskontos Bestandteil des Hauptvertrags (
          <a href="/agb">AGB</a>) und bedarf keiner gesonderten Unterzeichnung.
        </p>
      </section>

      <section>
        <h2>§ 1 Gegenstand und Dauer der Verarbeitung</h2>
        <p>
          Gegenstand dieses Vertrags ist die Verarbeitung personenbezogener Daten der Endkunden des
          Auftraggebers (Teilnehmer an dessen digitalem Treueprogramm) durch den Auftragsverarbeiter im
          Auftrag des Auftraggebers. Die Dauer der Verarbeitung entspricht der Laufzeit des Hauptvertrags
          zwischen den Parteien und endet automatisch mit dessen Beendigung, vorbehaltlich gesetzlicher
          Aufbewahrungspflichten (siehe § 8).
        </p>
      </section>

      <section>
        <h2>§ 2 Art und Zweck der Verarbeitung</h2>
        <p>
          Die Verarbeitung umfasst die Speicherung, Verwaltung und Anzeige digitaler Treuekarten-Daten, die
          Ausgabe eindeutiger QR-Codes zur Identifikation der Karte, die Synchronisierung mit Apple Wallet
          und Google Wallet bei aktiver Nutzung durch den Endkunden sowie die technische Bereitstellung der
          öffentlichen Kartenseite des Endkunden.
        </p>
      </section>

      <section>
        <h2>§ 3 Art der personenbezogenen Daten</h2>
        <ul>
          <li>Name des Endkunden</li>
          <li>E-Mail-Adresse des Endkunden (optional, falls vom Endkunden angegeben)</li>
          <li>Stempel- bzw. Punktestand und dessen Verlauf (Transaktionshistorie)</li>
          <li>Karten-ID / Seriennummer</li>
          <li>Bei Wallet-Nutzung: technische Gerätekennung zur Push-Benachrichtigung (kein Zugriff auf weitere Gerätedaten)</li>
        </ul>
      </section>

      <section>
        <h2>§ 4 Kategorien betroffener Personen</h2>
        <p>Endkunden (Kundschaft) des Auftraggebers, die an dessen digitalem Treueprogramm teilnehmen.</p>
      </section>

      <section>
        <h2>§ 5 Pflichten des Auftragsverarbeiters</h2>
        <p>Der Auftragsverarbeiter verpflichtet sich, personenbezogene Daten</p>
        <ul>
          <li>ausschließlich auf dokumentierte Weisung des Auftraggebers zu verarbeiten (Art. 28 Abs. 3 lit. a DSGVO), einschließlich in Bezug auf Datenübermittlungen an Drittländer, sofern nicht eine Verpflichtung nach dem Unionsrecht oder dem Recht der Mitgliedstaaten besteht;</li>
          <li>sicherzustellen, dass sich zur Verarbeitung befugte Personen zur Vertraulichkeit verpflichtet haben (lit. b);</li>
          <li>alle nach Art. 32 DSGVO erforderlichen technischen und organisatorischen Maßnahmen zu treffen (lit. c, siehe § 7);</li>
          <li>die Bedingungen für die Hinzuziehung weiterer Auftragsverarbeiter gemäß § 6 einzuhalten (lit. d);</li>
          <li>den Auftraggeber bei der Erfüllung von Betroffenenrechten (Art. 12-23 DSGVO) angemessen zu unterstützen (lit. e);</li>
          <li>den Auftraggeber bei der Einhaltung der Pflichten nach Art. 32-36 DSGVO zu unterstützen, insbesondere bei der Meldung von Datenschutzverletzungen (lit. f, siehe § 10);</li>
          <li>nach Wahl des Auftraggebers alle personenbezogenen Daten nach Beendigung der Erbringung der Verarbeitungsleistungen zu löschen oder zurückzugeben (lit. g, siehe § 8);</li>
          <li>dem Auftraggeber alle zum Nachweis der Einhaltung der Pflichten aus Art. 28 DSGVO erforderlichen Informationen zur Verfügung zu stellen (lit. h, siehe § 9).</li>
        </ul>
      </section>

      <section>
        <h2>§ 6 Weitere Auftragsverarbeiter (Subunternehmer)</h2>
        <p>
          Der Auftraggeber erteilt dem Auftragsverarbeiter die allgemeine Genehmigung, folgende weitere
          Auftragsverarbeiter zur Erbringung der Plattform einzusetzen:
        </p>
        <ul>
          <li>Supabase Inc. – Datenbank-, Authentifizierungs- und Speicher-Infrastruktur</li>
          <li>Resend – Versand transaktionaler E-Mails</li>
          <li>Apple Inc. / Google LLC – ausschließlich bei aktiver Nutzung von Apple Wallet bzw. Google Wallet durch den jeweiligen Endkunden</li>
        </ul>
        <p>
          Stripe Payments Europe, Ltd. verarbeitet ausschließlich die Zahlungsdaten des Auftraggebers selbst
          (nicht dessen Endkunden) und ist insoweit nicht Gegenstand dieses AVV. Der Auftragsverarbeiter
          informiert den Auftraggeber über die Hinzuziehung neuer Subunternehmer; der Auftraggeber kann
          dieser innerhalb von 14 Tagen aus wichtigem Grund widersprechen.
        </p>
      </section>

      <section>
        <h2>§ 7 Technische und organisatorische Maßnahmen (Art. 32 DSGVO)</h2>
        <ul>
          <li>Verschlüsselte Übertragung sämtlicher Daten (TLS) zwischen Endgerät, Plattform und Datenbank</li>
          <li>Mandantentrennung zwischen Betrieben durch rollenbasierte Zugriffskontrolle auf Datenbankebene (Row Level Security)</li>
          <li>Sichere Speicherung von Zugangsdaten (Passwort-Hashing, keine Klartext-Speicherung)</li>
          <li>Beschränkung des Zugriffs auf Mitarbeiterebene nach dem Erforderlichkeitsprinzip</li>
          <li>Regelmäßige, automatisierte Datensicherung</li>
          <li>Protokollierung sicherheitsrelevanter Vorgänge zur Nachvollziehbarkeit</li>
        </ul>
      </section>

      <section>
        <h2>§ 8 Löschung und Rückgabe nach Vertragsende</h2>
        <p>
          Nach Beendigung des Hauptvertrags löscht der Auftragsverarbeiter sämtliche personenbezogenen Daten
          des Auftraggebers oder gibt sie auf dessen Wunsch in einem gängigen Format zurück, soweit keine
          gesetzliche Aufbewahrungspflicht entgegensteht. Die Löschung erfolgt innerhalb einer angemessenen
          Frist nach Vertragsende.
        </p>
      </section>

      <section>
        <h2>§ 9 Nachweis- und Kontrollrechte</h2>
        <p>
          Der Auftragsverarbeiter stellt dem Auftraggeber auf Anfrage die zur Erfüllung der
          Nachweispflichten aus Art. 28 DSGVO erforderlichen Informationen zur Verfügung und ermöglicht
          Kontrollen, einschließlich Inspektionen, in zumutbarem Umfang und mit angemessener Vorankündigung.
        </p>
      </section>

      <section>
        <h2>§ 10 Meldepflichten bei Datenschutzverletzungen</h2>
        <p>
          Bei Bekanntwerden einer Verletzung des Schutzes personenbezogener Daten im Verantwortungsbereich
          des Auftragsverarbeiters informiert dieser den Auftraggeber unverzüglich, spätestens jedoch
          innerhalb von 48 Stunden nach Kenntniserlangung, und unterstützt ihn bei der Erfüllung etwaiger
          Melde- und Benachrichtigungspflichten gegenüber der Datenschutzbehörde bzw. den Betroffenen.
        </p>
      </section>

      <section>
        <h2>§ 11 Haftung</h2>
        <p>
          Es gelten die Haftungsregelungen gemäß § 9 der <a href="/agb">AGB</a> entsprechend.
        </p>
      </section>

      <section>
        <h2>§ 12 Schlussbestimmungen</h2>
        <p>
          Dieser AVV ist Bestandteil des Hauptvertrags zwischen den Parteien und wird mit Anlage eines
          Betriebskontos auf der Plattform Matei Loyalty wirksam, ohne dass es einer gesonderten
          Unterzeichnung bedarf. Es gilt österreichisches Recht. Sollte eine Bestimmung dieses Vertrags
          unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
        </p>
      </section>

      <PrintButton />
    </LegalLayout>
  );
}
