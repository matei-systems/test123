# Abschlussbericht – Matei Systems Plattform (Stand 04.11.2026)

## Status auf einen Blick

- **Live auf matei.systems** (Deployment `4f08f4f`, Status READY). Typprüfung ohne Fehler, Produktions-Build erfolgreich,
  153 Datenbank-Tests und 3 Parallelitätstests bestanden, öffentliche Seiten auf Desktop, Handy und im Dunkelmodus geprüft.
- **Datenbank aktualisiert (04.11.2026):** Migration P18 samt Schreibsperre und Admin-Eintrag wurde von dir im
  Supabase SQL Editor eingespielt (der automatische Weg über die Supabase-Anbindung blieb sechsmal unbestätigt) und
  danach von mir an der Live-Datenbank geprüft. Der Build-Schutz (`scripts/vercel-ignore-build.mjs`) hat daraufhin den
  Build durchgelassen.
- **Ende-zu-Ende-Tests in Produktion bestanden** (Geschäft, Kundin, Kasse, Admin, Sicherheitsproben, siehe Tabelle unten).
  Alle Testdaten sind wieder entfernt, deine bisherigen Daten sind unverändert.
- **Offen (klein):** `supabase/p18_hardening.sql` einmal im SQL Editor ausführen (Hinweise des Supabase-Sicherheits-Advisors,
  kein akutes Risiko). Außerdem prüfen: die Google-Wallet-Aussteller-ID (siehe „Was fehlt“).

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

**In Produktion mit Testkonten durchgespielt (Browser und API):**
- Geschäft: Registrierung, Betrieb anlegen (Testphase 14 Tage serverseitig gesetzt), Programm per Assistent, zweite Belohnung,
  Profil ausfüllen und einreichen, Aufsteller, alle Geschäftsseiten.
- Kundin: Registrierung mit Rückkehr zur Beitrittsseite, Karte ins Wallet, Kartendetail mit gesperrten/frei werdenden
  Belohnungen, Verlauf, Profil, Rollenschutz (kein Zugang zu Admin und Geschäftsbereich).
- Kasse: Stempel buchen, Doppelscan innerhalb von 30 s abgelehnt, Einlöse-Code der Kundin (6 Zeichen, Countdown),
  Einlösung per Kurzcode im Scanner, Kundin sieht Abschluss und Verlauf, derselbe Code lässt sich nicht erneut einlösen.
- Admin: Prüf-Warteschlange, Ablehnen nur mit Begründung, Freischalten, Verzeichnis und öffentliches Profil erscheinen,
  Suche und Filter, Meldung und Kontaktanfrage kommen an, Pausieren blendet sofort aus, Pause aufheben, Audit-Protokoll.

**Auf Datenbankebene zusätzlich vollständig getestet** (153 Tests, siehe unten): Vergabe nach Regel, Betrag und Aktion,
Einlösen an der Kasse, Einlöse-Codes, Kartenübernahme, Sichtbarkeit je Rolle, Prüfstatus-Regeln, Löschschutz,
Verdachtsmarkierung, Schutz von Abo- und Rollenfeldern.

**Nicht in Produktion durchgespielt:** Zahlungen/Stripe, Team-Einladungen per E-Mail, Konto löschen, Datenexport, Kamera-Scan
(im Test ohne Kamera, stattdessen Kurzcode), die Verdachtsmarkierung im Adminbereich (löst erst bei 8 Buchungen pro 24 h aus,
auf Datenbankebene getestet), dein eigener Admin-Login.

Unverändert weiter in Betrieb: Abrechnung über Stripe, Team und Einladungen, Standorte, Support-Tickets,
Programm-Editor, Live-Aktualisierung der Kundenkarte.

## Was fehlt, Demo oder „in Vorbereitung“

- **Apple Wallet:** Code vorhanden, es fehlen Apple-Developer-Konto und Zertifikate. Der Button zeigt „In Vorbereitung“.
- **Google Wallet:** Technisch eingebunden, der Issuer ist aber noch im Demo-Modus. Der Button ist für Kunden
  ausgeblendet, bis du nach der Google-Freigabe `GOOGLE_WALLET_PUBLISHED=true` setzt. Zum Testen mit Testkonten:
  `/api/wallet/google?serial=…`. **Auffund aus den Vercel-Protokollen:** Google lehnt die hinterlegte Aussteller-ID seit
  August mit „not a valid id“ ab (`BCR2DN7TTCKKDAQX…`). Das sieht nach einer Händler-ID (Google Pay) statt der
  numerischen Issuer-ID der Google-Wallet-API aus. Die Fehler werden nur protokolliert und stören Stempeln und Einlösen nicht.
  Bitte in der Google Pay & Wallet Console die Issuer-ID prüfen und `GOOGLE_WALLET_ISSUER_ID` in Vercel anpassen.
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
| Live-Datenbank nach dem Einspielen von P18 | 2 Geschäftsprofile mit eindeutigen Adressen, 3 Hauptbelohnungen, 1 Admin-Eintrag, RLS auf allen neuen Tabellen, keine direkten Schreibrechte auf Karten-Salden, Buchungen, Einlösungen und Mitgliedschaften, Buchungsfunktionen nur für eingeloggte Nutzer |
| Supabase-Sicherheitsprüfung (Advisor) nach P18 | keine Lücken; Hinweise: Admin-Tabellen ohne Policy (gewollt, nur Server-Zugriff), Trigger-Funktionen mit veränderlichem Suchpfad bzw. über die API sichtbar (nicht aufrufbar, siehe Empfehlungen), Leaked-Password-Schutz in Supabase Auth aus |
| E2E Stufe 1/1b: Geschäft, Betrieb, Programm, Belohnung, Profil, Aufsteller (`tests/e2e`) | bestanden (Stufe 1b 13/13) |
| E2E Stufe 2: Kundin, Beitritt, Wallet, Rollenschutz | bestanden (13/14, siehe Hinweis) |
| E2E Stufe 3: Stempeln, Doppelscan-Schutz, Einlöse-Code, Einlösung, Einmal-Code | bestanden (14/15, siehe Hinweis) |
| E2E Stufe 4: 40 Angriffsproben über die Datenbank-API (Kundin, Inhaber, anonym, Abo-Fälschung) | **alle abgewehrt**: Direktzugriffe auf Salden, Buchungen, Einlösungen, Mitgliedschaften, Abo und Admin-Liste gesperrt; Funktionen verlangen Rolle; benutzter Code nicht erneut einlösbar |
| E2E Stufe 5: Adminbereich, Verzeichnis, Meldung, Kontakt | bestanden (24/24) |
| Aufräumen | alle Testdaten entfernt (3 Konten, 2 Betriebe, Meldung, Kontaktnachricht, 4 Audit-Einträge der Test-Admin-Rolle); Gegenprobe: ursprüngliche Daten unverändert, nur dein Admin-Eintrag vorhanden |

Hinweis zu den Fehlschlägen im ersten Lauf: Drei Prüfungen schlugen zunächst wegen des Testskripts fehl (zu früh geprüft,
bevor die Weiterleitung nach dem Speichern ankam; abweichender Wortlaut einer Fehlermeldung). Das Verhalten der App war
jeweils korrekt und wurde durch Folgeschritte oder Wiederholung bestätigt; die Skripte sind korrigiert. Zwei weitere
Fehlschläge lagen an der Testmethode (eingeklapptes Formular, `.select()` bei der Betriebsanlage, das die App selbst nicht nutzt).

## Lokal starten und veröffentlichen

Siehe `README.md`. Kurzfassung:
1. `npm ci`
2. `.env.local` nach `.env.example` anlegen.
3. In Supabase `schema.sql` → `p18_platform.sql` → `p18_lockdown.sql` → `p18_hardening.sql` ausführen und den Admin eintragen.
4. `npm run dev`

**Veröffentlichen:** Push auf den Produktions-Branch. Vercel baut automatisch; der Build-Schutz überspringt den Build nur, solange die Migration P18 in der Datenbank fehlt.

## Empfehlungen an dich

1. `supabase/p18_hardening.sql` im SQL Editor ausführen (getestet, wiederholbar) und „Leaked password protection“ in
   Supabase Auth aktivieren, sobald der Plan es erlaubt (Hinweise des Supabase-Advisors).
2. Supabase-Plan: Der kostenlose Plan pausiert das Projekt nach etwa einer Woche Inaktivität. Das war die Ursache des
   Ausfalls. Für den Echtbetrieb lohnt ein bezahlter Plan.
3. Nach dem Admin-Eintrag unter `/admin/organizations` die Testphasen deiner Test-Betriebe verlängern.
4. E-Mail-Bestätigung in Supabase aktivieren und Resend für E-Mails einrichten.
5. In Vercel `GOOGLE_WALLET_PRIVATE_KEY` und `SUPABASE_SERVICE_ROLE_KEY` als „Sensitive“ markieren.
6. Rechtstexte prüfen lassen.
