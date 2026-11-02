# Bestandsaufnahme & Umsetzungsplan (Stand 02.11.2026)

## Technik

- Next.js 14.2 (App Router, Server Actions), TypeScript, Tailwind 3
- Supabase: Postgres 17 + Auth + Storage (`card-assets`) + Row Level Security, Projekt `matei.loyality` (eu-west-3)
- Hosting: Vercel-Projekt `loyality`, Domain `matei.systems`, Production-Branch `claude/matei-loyalty-saas-zmus2o`
- Integrationen: Stripe (konfiguriert), Google Wallet (konfiguriert, Issuer noch im Demo-Modus),
  Apple Wallet (Code fertig, keine Zertifikate), Resend-E-Mail (nicht konfiguriert), Sentry (nicht konfiguriert)

## Was funktioniert (vor dieser Etappe)

Geschäfts-Registrierung/Login/Passwort-Reset, Betrieb anlegen (inkl. AVV), Treueprogramme (Stempel/Punkte,
Design-Editor, Bild-Upload), Karten ausgeben, öffentlicher Beitritt per QR (`/j/[programId]`) ohne Kundenkonto,
öffentliche Kundenkarte (`/c/[serial]`) mit Live-Aktualisierung, Kamera-Scanner, Verdienregel nach Einkaufsbetrag,
Team mit Rollen (Inhaber/Admin/Mitarbeiter) + Einladungen, Standorte, Aktivitätsprotokoll, Abo-Abrechnung mit
14-Tage-Testphase, Rechtsseiten (österreichisches Recht), Support-Tickets, Admin-Panel (Betriebe, Nutzer, Abos,
Rechnungen, Support), Rate-Limiting, Sicherheits-Header, Health-Endpoint, Google-/Apple-Wallet-Pässe.

## Gefundene Probleme

| # | Befund | Schwere |
|---|--------|---------|
| 1 | Supabase-Projekt war pausiert (Free-Tier-Inaktivität) → Login, Dashboard, Kundenkarten komplett down | kritisch – **behoben** (wiederhergestellt) |
| 2 | Kein Plattform-Admin eingetragen → `/admin` für niemanden erreichbar | hoch |
| 3 | Testphasen beider Test-Betriebe abgelaufen → schreibende Aktionen im Dashboard gesperrt | mittel (gewolltes Verhalten, aber unbemerkt) |
| 4 | Punktevergabe/Einlösung nicht atomar (Lesen→Rechnen→Schreiben in der App). Zwei gleichzeitige Einlösungen konnten doppelt einlösen; Mitarbeiter konnten Salden per REST-API direkt ändern und Buchungen frei anlegen (RLS erlaubte das) | hoch (Sicherheit) |
| 5 | Keine Kundenkonten – Kunden sind anonyme Datensätze je Betrieb, kein betriebsübergreifendes Wallet | Produktlücke |
| 6 | Tabellen `rewards` und `campaigns` existieren, werden aber nicht genutzt (nur 1 fixe Belohnung je Programm) | Produktlücke |
| 7 | Kein öffentliches Geschäftsprofil/Verzeichnis, keine Felder für Beschreibung/Kategorie/Öffnungszeiten | Produktlücke |
| 8 | Keine Konto-Löschung (DSGVO Art. 17) | mittel |
| 9 | Kein Favicon, kein Web-App-Manifest | niedrig |
| 10 | E-Mail-Bestätigung in Supabase Auth deaktiviert → E-Mail-Adressen sind unbestätigt | mittel (Empfehlung) |
| 11 | `GOOGLE_WALLET_PRIVATE_KEY` in Vercel als lesbares statt „Sensitive"-Secret gespeichert | niedrig (Empfehlung) |

## Datenbestand (live)

2 Nutzerkonten (beide vom Inhaber), 2 Betriebe, 3 Programme, 10 Kunden/Karten, 11 Buchungen, 1 Einlösung.
Alle Bestandsdaten bleiben erhalten; Migrationen sind ausschließlich additiv.

## Umsetzungsplan

1. **Design** in Canva (Marke, Farben, Typografie, Komponenten, Landingpage, Mobile, Werbemittel) → Designsystem im Code.
2. **Datenbank** (additiv): atomare Punktevergabe/Einlösung als serverseitige Funktionen mit Zeilensperre und
   Idempotenz, direkte Saldo-Schreibrechte entzogen; Kundenkonten (`customers.user_id`) mit eigenen Leserechten;
   Geschäftsprofil + Prüfstatus; Rewards-Katalog (bestehende Belohnungen werden übernommen); Aktionen mit
   serverseitig wirkendem Multiplikator; kurzlebige Einlöse-Codes; automatische Verdachts-Markierung von Buchungen;
   Meldungen und Kontaktanfragen.
3. **Öffentliche Website**: Startseite mit Einstiegen „Für Kunden" / „Für Geschäfte", eigene Seiten für beide
   Zielgruppen, Geschäftsverzeichnis mit Suche/Filter (nur echte, freigeschaltete Betriebe), Geschäftsprofile,
   FAQ, Kontakt, Manifest/Icons.
4. **Kundenbereich** `/konto`: Wallet mit getrenntem Saldo je Geschäft, Kartendetails mit QR, Verlauf,
   verfügbare Rewards + Einlöse-Code, Profil, Konto löschen.
5. **Geschäftsbereich**: Profil, Einreichen zur Prüfung + Status, Rewards, Aktionen, Scanner mit Reward-Auswahl
   und Einlöse-Code, Statistiken.
6. **Adminbereich**: Prüf-Warteschlange, verdächtige Buchungen, Audit-Log, Meldungen/Kontakt, Rewards sperren.
7. **Tests**: Typecheck, Build, SQL-Sicherheitstests (in zurückgerollten Transaktionen), Browser-E2E.
8. **Doku & Abschlussbericht**.
