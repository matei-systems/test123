# Ende-zu-Ende-Tests (Browser + API)

Skripte, die die eingeloggten Abläufe wie echte Nutzer durchspielen. Sie laufen gegen eine **laufende App mit echter
Supabase-Datenbank** und legen dabei **echte Konten, einen Betrieb, ein Programm und Buchungen an**. Nur gegen eine
Test- oder Staging-Datenbank ausführen, oder gegen Produktion mit anschließender Bereinigung (unten).

Voraussetzungen: Node.js 20+, `playwright` (mit installiertem Chromium) und `@supabase/supabase-js` (liegt in
`node_modules`). In Supabase muss die E-Mail-Bestätigung ausgeschaltet sein (die Testkonten nutzen `@example.com`).

```bash
export BASE=https://deine-domain.at            # oder http://localhost:3000
export NEXT_PUBLIC_SUPABASE_URL=...            # öffentliche Werte, wie im Browser
export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
export NODE_PATH=$(npm root -g)                # falls Playwright global installiert ist

node tests/e2e/s1_owner.js      # Geschäft registrieren, Betrieb anlegen (Testphase), Programm per Assistent
node tests/e2e/s1b_continue.js  # Belohnung, Aktionen, Profil einreichen, Aufsteller, Geschäftsseiten
node tests/e2e/s2_customer.js   # Kundin registriert sich, holt die Karte, Wallet, Rollenschutz
node tests/e2e/s3_flow.js       # Stempeln, Doppelscan-Schutz (wartet 32 s), Einlöse-Code, Einlösen an der Kasse
node tests/e2e/s3b_reuse.js     # benutzter und unbekannter Code im Scanner
node tests/e2e/s4_security.js   # Angriffsproben über die Datenbank-API (Direktzugriffe, Rollen, Einmal-Code)
node tests/e2e/s4b_org.js       # Betrieb mit gefälschten Abo-Feldern: Testphase wird serverseitig gesetzt
```

Die Stufen bauen aufeinander auf und teilen sich Zustand und Anmeldungen in `tests/e2e/.state/` (git-ignoriert,
enthält die Testzugangsdaten). Screenshots landen in `.state/shots/`.

## Adminbereich (`s5_admin.js`)

Braucht einen Plattform-Admin. Dem Test-Inhaber **nur für den Lauf** die Rolle geben und danach wieder entziehen
(E-Mail steht in `.state/state.json`):

```sql
insert into platform_admins (user_id, role)
select id, 'superadmin' from auth.users where email = 'e2e-owner-XXXX@example.com';
-- ... node tests/e2e/s5_admin.js ...
delete from platform_admins where user_id in (select id from auth.users where email like 'e2e-%@example.com');
```

## Aufräumen

Alle Testdaten tragen `e2e-…@example.com` bzw. den Betriebsnamen `E2E …`. Erst nachsehen, dann löschen:

```sql
select id, email from auth.users where email like 'e2e-%@example.com';
select id, name from organizations where name like 'E2E %';
-- löschen: organizations (Programme, Karten, Buchungen, Belohnungen hängen per ON DELETE CASCADE daran),
-- danach contact_messages der Testadresse, zuletzt die Auth-Benutzer. Audit-Einträge des Test-Admins gezielt per ID.
```

## Hinweise

- Die Skripte prüfen Texte der deutschen Oberfläche; bei geänderten Beschriftungen die Erwartungen anpassen.
- Fehlschläge sofort prüfen: In der Vergangenheit lagen sie meist an zu frühen Prüfungen (Server Actions leiten erst
  nach dem Speichern weiter), nicht an der App.
- Datenbanklogik (Rollen, Salden, Parallelität) wird zusätzlich ohne Browser getestet: `supabase/tests/run.sh`.
