# Abschlussbericht – Matei Systems Plattform (Stand 02.11.2026)

## Status auf einen Blick

- **Code fertig, gebaut und getestet:** Typprüfung ohne Fehler, Produktions-Build erfolgreich, 153 Datenbank-Tests und
  3 Parallelitätstests bestanden, öffentliche Seiten im Browser auf Desktop, Handy und im Dunkelmodus geprüft.
- **Noch nicht live:** Die Datenbank-Migration P18 braucht deine Bestätigung im Supabase-Dialog (zweimal ohne Antwort
  abgelaufen). Bis sie eingespielt ist, überspringt Vercel den Build (`scripts/vercel-ignore-build.mjs`), und die
  bisherige Version bleibt unverändert online.
- **Danach:** Migration + Lockdown + Admin-Eintrag einspielen → Deploy → Ende-zu-Ende-Tests der eingeloggten Abläufe
  in Produktion mit Testkonten → Testdaten entfernen.

## Wichtigste Änderungen

1. **Designsystem aus Canva im echten Code** – helle Markenpalette (Papier, Bernstein, Waldgrün), Fraunces + Inter,
   Komponentenklassen, Dunkelmodus für die ganze App. Die bestehenden Bereiche wurden per Token-Mapping und Codemod
   (59 Dateien) umgestellt, nicht neu geschrieben.
2. **Öffentliche Website** – neue zweiseitige Startseite, „Für Kunden“, „Für Geschäfte“ (bisherige Landingpage mit
   Live-Demo und Preisen), Geschäftsverzeichnis mit Suche, Kategorie- und Ortsfilter, öffentliche Geschäftsprofile
   (Programme, Belohnungs-Tickets, Aktionen, Öffnungszeiten, Teilnahmebedingungen), FAQ, Kontaktformular, „Profil
   melden“, Offline-Seite, Web-App-Manifest mit Icons und Favicon.
3. **Kundenbereich `/konto`** – Registrierung mit Kontotyp, Wallet mit getrenntem Stand je Geschäft, Kartendetail mit
   QR-Code, Belohnungen samt Bedingungen, Einlöse-Code (QR + 6-stelliger Kurzcode, Live-Status, Countdown), Verlauf,
   QR-Scanner für Tresen-Codes, Karte verknüpfen, Profil (Name, E-Mail, Passwort), Datenexport, Konto löschen.
4. **Geschäftsbereich** – Geschäftsprofil mit Logo, Beschreibung, Kategorie, Standort, Öffnungszeiten und Prüfstatus
   samt Begründung; Belohnungen und Aktionen anlegen, bearbeiten, pausieren, beenden; Scanner mit Belohnungsauswahl,
   Bestätigung und Einlöse-Codes; Übersicht mit Prüfstatus, Schnellzugriffen und echten Kennzahlen; Programme
   pausieren statt löschen.
5. **Adminbereich** – Prüf-Warteschlange (freischalten, ablehnen, pausieren mit Begründung), Belohnungen sperren,
   verdächtige Buchungen, Meldungen und Kontaktanfragen, Audit-Protokoll, Moderationszähler auf der Übersicht.
6. **Sicherheit** (Datenbank, `supabase/p18_platform.sql` + `p18_lockdown.sql`):
   - Salden ändern sich nur über geprüfte Funktionen mit Zeilensperre und Idempotenz.
   - Direktes Schreiben auf Karten, Buchungen, Einlösungen und Mitgliedschaften ist entzogen.
   - Abo- und Prüffelder sind gegen Manipulation geschützt.
   - Auffällige Buchungen werden automatisch markiert.

   Behobene Lücken aus dem Bestand:
   - Beim Beitritt gab eine fremde E-Mail die Karte dieser Person heraus.
   - Teammitglieder konnten Salden per API direkt setzen.
   - Gleichzeitige Einlösungen konnten doppelt durchgehen.
   - Beim Anlegen eines Betriebs ließ sich das Abo umgehen.
   - Admins konnten sich per API selbst zum Inhaber machen.
7. **Ehrliche Texte** – Aussagen zu Apple/Google Wallet als „in Vorbereitung“ gekennzeichnet (Startseite, B2B-Seite,
   Tarife, Kartenseite). Partnergeschäfte und Kennzahlen erscheinen nur mit echten Daten.

## Canva-Designs (tatsächlich erstellt und verwendet)

Erstellt habe ich sie über die Canva-Anbindung per KI-Generierung nach meinem Briefing, in deinem Canva-Konto:

| Design | Link | Verwendung |
|---|---|---|
| Markenleitfaden (18 Seiten) | https://www.canva.com/d/4cP3zJtkPW4rEPY | Farben, Schriften, Logo, Text-Stempel, Ticket-Motiv |
| Website / Landingpage | https://www.canva.com/d/hlAFymHrZcl1EaZ | Aufbau der Startseite |
| App-Screens (5 Seiten) | https://www.canva.com/d/kDoybadHOEa-kSO | Wallet, Kartendetail, Verzeichnis, Scanner, Geschäftsübersicht |
| Tresen-Aufsteller (A5) | https://www.canva.com/d/fSWhO_-dD8lMOwc | Druckvorlage `/poster/[programId]` |

Die Designs sind Vorlage. Die Website selbst ist echtes HTML/CSS, es werden keine Canva-Bilder als Seiteninhalt
verwendet.

Grenzen beim Arbeiten mit Canva:
- Der Export des Markenleitfadens lieferte leere Bilder.
- Der Export der Landingpage wurde von Canva abgelehnt („Not allowed“). Dort habe ich mit dem Vorschaubild gearbeitet.
- Die KI hat Tippfehler in die Dateien geschrieben („Frances“, „Treu/Freue, die bleibt“). Ich habe sie nicht ungefragt
  in deinem Konto geändert. Details in `docs/DESIGNSYSTEM.md`.

## Was funktioniert

**Im Browser geprüft (gegen die Live-Datenbank):** öffentliche Seiten, Registrierung und Login (Formulare),
Rechtsseiten, Dunkelmodus, Handy-Darstellung.

**Auf Datenbankebene vollständig getestet** (153 Tests, siehe unten): Vergabe nach Regel, Betrag und Aktion,
Einlösen an der Kasse, Einlöse-Codes, Kartenübernahme, Sichtbarkeit je Rolle, Prüfstatus-Regeln, Löschschutz,
Verdachtsmarkierung, Schutz von Abo- und Rollenfeldern.

**Implementiert und gebaut, aber erst nach dem Einspielen der Migration im Browser prüfbar:** alle eingeloggten
Abläufe in Kundenkonto, Geschäftsbereich und Adminbereich, die die neuen Tabellen und Funktionen nutzen.

Unverändert weiter in Betrieb: Abrechnung über Stripe, Team und Einladungen, Standorte, Support-Tickets,
Programm-Editor, Live-Aktualisierung der Kundenkarte.

## Was fehlt, Demo oder „in Vorbereitung“

- **Apple Wallet:** Code vorhanden, es fehlen Apple-Developer-Konto und Zertifikate. Der Button zeigt „In Vorbereitung“.
- **Google Wallet:** Technisch eingebunden, der Issuer ist aber noch im Demo-Modus. Der Button ist für Kunden
  ausgeblendet, bis du nach der Google-Freigabe `GOOGLE_WALLET_PUBLISHED=true` setzt. Zum Testen mit Testkonten:
  `/api/wallet/google?serial=…`.
- **E-Mail-Versand** (Resend nicht eingerichtet): keine automatischen Mails bei Prüfentscheidungen. Kontaktanfragen
  beantwortest du per E-Mail aus dem Adminbereich.
- **E-Mail-Bestätigung** ist in Supabase Auth deaktiviert. Ich empfehle, sie zu aktivieren. Der Bestätigungs-Ablauf
  ist in der App vorhanden.
- Punkte geschäftsübergreifend einlösen gibt es laut Produktvision zum Start bewusst nicht.
- Echte Zahlungen von Kunden gibt es nicht.
- Eigene Stadt-Landingpages fehlen. Der Ortsfilter im Verzeichnis ist da, das Datenmodell ist für weitere Städte und
  Branchen vorbereitet.
- Inhaberwechsel, Löschen eines Betriebs und Konto-Löschung eines Inhabers laufen über den Support.
- Ein offener Einlöse-Code lässt sich nicht stornieren. Er läuft nach 10 Minuten ab oder wird durch einen neuen
  ersetzt, und das Guthaben wird erst beim Einlösen abgezogen.
- **Rechtstexte:** Die neuen Abschnitte (Kundenkonten, Verzeichnis, Kontakt, Missbrauchsschutz, Hosting) in
  Datenschutzerklärung und AGB sind vorbereitet und **sollten rechtlich geprüft werden**. In AGB und AVV steht weiter
  der Produktname „Matei Loyalty“, weil Betriebe diesen Texten bereits zugestimmt haben.

## Tests und Ergebnisse

| Test | Ergebnis |
|---|---|
| `npx tsc --noEmit` | 0 Fehler |
| `npm run build` | erfolgreich (57 Routen), nur bekannte Sentry-Hinweise |
| `supabase/tests/run.sh` (lokales PostgreSQL 16, Supabase-Nachbildung, echte Rollen und JWT-Claims) | **153/153 bestanden** |
| `supabase/tests/concurrency.sh` (zwei parallele Sitzungen) | **3/3:** Einlösung genau einmal, Code genau einmal, Doppel-Scan nur ein Stempel |
| Gegenprobe der Test-Helfer mit absichtlich falschen Erwartungen | schlagen wie erwartet fehl |
| Browser (Playwright): 11 öffentliche Seiten, je Desktop 1440 px und Handy 390 px, dazu 3 Seiten dunkel | alle HTTP 200, keine JS-Fehler, kein horizontales Überlaufen, Sichtprüfung der Screenshots |
| Build-Schutz gegen die Live-Datenbank | überspringt den Build korrekt, solange P18 fehlt |
| Ende-zu-Ende eingeloggte Abläufe in Produktion | **ausstehend**, braucht die Migration |

## Lokal starten und veröffentlichen

Siehe `README.md`. Kurzfassung:
1. `npm ci`
2. `.env.local` nach `.env.example` anlegen.
3. In Supabase `schema.sql` → `p18_platform.sql` → `p18_lockdown.sql` ausführen und den Admin eintragen.
4. `npm run dev`

**Veröffentlichen:** Push auf den Produktions-Branch. Vercel baut automatisch, sobald die Migration in der Datenbank ist.

## Empfehlungen an dich

1. Migration freigeben (siehe Nachricht im Chat).
2. Supabase-Plan: Der kostenlose Plan pausiert das Projekt nach etwa einer Woche Inaktivität. Das war die Ursache des
   Ausfalls. Für den Echtbetrieb lohnt ein bezahlter Plan.
3. Nach dem Admin-Eintrag unter `/admin/organizations` die Testphasen deiner Test-Betriebe verlängern.
4. E-Mail-Bestätigung in Supabase aktivieren und Resend für E-Mails einrichten.
5. In Vercel `GOOGLE_WALLET_PRIVATE_KEY` und `SUPABASE_SERVICE_ROLE_KEY` als „Sensitive“ markieren.
6. Rechtstexte prüfen lassen.
