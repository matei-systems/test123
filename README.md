# Matei Systems — Treueplattform für lokale Geschäfte

Next.js 14 (App Router, Server Actions) · TypeScript · Tailwind · Supabase (Postgres, Auth, Storage, RLS) · Vercel

Kundinnen und Kunden sammeln bei teilnehmenden Geschäften Stempel oder Punkte und lösen sie dort gegen die Belohnungen
des jeweiligen Geschäfts ein. Geschäfte verwalten Profil, Programme, Belohnungen und Aktionen; das Plattform-Team
prüft Profile und Verdachtsfälle. Design: siehe [docs/DESIGNSYSTEM.md](docs/DESIGNSYSTEM.md) (Vorlage in Canva).
Stand und offene Punkte: [docs/ABSCHLUSSBERICHT.md](docs/ABSCHLUSSBERICHT.md).

## Bereiche

| Bereich | Pfade | Wer |
|---|---|---|
| Öffentliche Website | `/`, `/fuer-kunden`, `/fuer-geschaefte`, `/geschaefte`, `/geschaefte/[slug]`, `/faq`, `/kontakt`, Rechtsseiten | alle |
| Karte holen / ansehen | `/j/[programId]` (Beitritt per QR), `/c/[serial]` (Karte per Link) | alle |
| Kundenkonto | `/konto` (Wallet), `/konto/karten/[id]`, `/konto/einloesen/[id]`, `/konto/verlauf`, `/konto/profil`, `/konto/scannen`, `/konto/verknuepfen` | eingeloggte Kunden |
| Geschäftsbereich | `/dashboard` (+ `scan`, `programs`, `belohnungen`, `aktionen`, `customers`, `profil`, `team`, `locations`, `billing`, `support`) | Teammitglieder (Rollen Inhaber/Admin/Mitarbeiter) |
| Adminbereich | `/admin` (+ `pruefungen`, `markierungen`, `meldungen`, `audit`, `organizations`, `users`, …) | Plattform-Admins (`platform_admins`) |

Nach Login/Registrierung führt `/weiter` rollenabhängig ins Dashboard (Mitglied eines Betriebs) oder ins Kundenkonto.

## Lokal starten

Voraussetzung: Node.js 20+, ein Supabase-Projekt.

```bash
npm ci
cp .env.example .env.local   # Werte aus Supabase -> Project Settings -> API eintragen
```

Datenbank (Supabase -> SQL Editor), **in dieser Reihenfolge**:

1. `supabase/schema.sql` – Grundschema P1–P17 (wiederholt ausführbar)
2. `supabase/p18_platform.sql` – Plattform: Kundenkonten, Geschäftsprofile + Prüfstatus, Rewards, Aktionen, atomare
   Buchungsfunktionen, Einlöse-Codes, Verdachtsmarkierung, Meldungen/Kontakt, Schutz von Abo- und Rollenfeldern
3. `supabase/p18_lockdown.sql` – entzieht direkte Schreibrechte auf Salden/Buchungen (nur mit dieser App-Version)
4. Plattform-Admin eintragen:
   ```sql
   insert into platform_admins (user_id, role)
   select id, 'superadmin' from auth.users where lower(email) = 'deine@adresse.at'
   on conflict (user_id) do nothing;
   ```

```bash
npm run dev        # http://localhost:3000
npm run build      # Produktions-Build (prüft auch Typen)
```

## Tests

- **Datenbank (Sicherheit & Logik):** `supabase/tests/run.sh` baut gegen einen lokalen PostgreSQL 16 eine
  Supabase-Nachbildung (Rollen `anon`/`authenticated`/`service_role`, `auth.uid()` aus JWT-Claims), spielt
  Schema + P18 ein und führt 153 Tests unter den echten Rollen aus (RLS-Isolation, gesperrte Direktzugriffe,
  Vergabe/Einlösung, Idempotenz, Einmal-Codes, Kartenübernahme, Verdachtsmarkierung, Löschschutz).
  `supabase/tests/concurrency.sh` prüft echte Parallelität (zwei Kassen gleichzeitig).
- **Typen & Build:** `npx tsc --noEmit`, `npm run build`.

## Deployen (Vercel)

- Produktions-Branch pushen; Umgebungsvariablen wie in `.env.example` in Vercel hinterlegen
  (`SUPABASE_SERVICE_ROLE_KEY` und alle Schlüssel als „Sensitive“).
- `vercel.json` setzt einen *Ignored Build Step* (`scripts/vercel-ignore-build.mjs`): Fehlt die Migration P18 in der
  Datenbank, wird der Build übersprungen und die laufende Version bleibt online. Reihenfolge daher:
  **Migration einspielen → deployen → Lockdown einspielen.**

## Sicherheit (Kurzfassung)

- Stempel, Punkte und Einlösungen ändern Salden **nur** über Datenbankfunktionen (`earn_on_card`, `redeem_reward`,
  `redeem_with_code`) mit Zeilensperre, Mitgliedschafts-, Sperr-, Abo- und Guthabenprüfung; jede Bewegung landet im
  Buchungsjournal mit Saldo danach. Doppelt abgeschickte Formulare sind per Request-ID idempotent.
- Einlöse-Codes: 36-stelliger Zufallstoken + 6-stelliger Kurzcode, 10 Minuten gültig, nur einmal einlösbar, nur vom
  eigenen Betrieb.
- Row Level Security auf allen Tabellen; Kunden sehen nur eigene Karten, Betriebe nur eigene Daten. Abo-Felder,
  Mitgliedschaften, Salden und Buchungen sind über die API nicht direkt schreibbar.
- Service-Role-Schlüssel nur serverseitig (Admin-Panel, öffentliche Karte, Beitritt, Rate-Limits).
- Rate-Limits für Login, Registrierung, Kontakt, Meldungen, Beitritt, Einlöse-Codes.

## Projektstruktur

```
app/                 Seiten (App Router) und Server Actions je Bereich
components/site/     Öffentlicher Seitenrahmen, Illustrationen, Geschäftskarte
components/konto/    Kundenbereich (Navigation, Wallet-Karte, Live-Einlöse-Code, Scanner)
components/ui/       Logo, Theme-Umschalter, Service-Worker-Registrierung
components/scan/     Kamera-Hook + Kassen-Scanner
lib/ledger.ts        Einziger Zugang zu den Buchungsfunktionen + Fehlermeldungen
lib/konto.ts         Datenzugriff Kundenbereich
lib/directory.ts     Öffentliches Verzeichnis (Anon-Client)
lib/programs.ts      Anzeige-Helfer (Regeln, Kosten, Datumsformate, sichere Links)
supabase/            Schema, P18-Migration, Lockdown, Tests
scripts/             Vercel-Build-Schutz
docs/                Bestandsaufnahme, Designsystem, Abschlussbericht
```
