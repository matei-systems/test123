# Matei Loyalty — Digitale Treuekarten (MVP)

Next.js 14 · TypeScript · Tailwind · Supabase (Postgres + Auth + RLS)

Das ist das lauffähige Fundament: Login/Registrierung, Betrieb anlegen,
Treueprogramme (Stempel **oder** Punkte), Karten an Kunden ausgeben,
Stempel/Punkte vergeben, Belohnungen einlösen, und eine öffentliche
Kundenkarte mit echtem QR-Code.

Der Build ist geprüft (`next build` läuft sauber). Das Datenmodell inkl.
Mandanten-Trennung (Row Level Security) wurde gegen eine echte Postgres-DB
getestet.

---

## In 15 Minuten lokal starten

**Voraussetzung:** Node.js 18+ und ein (kostenloses) Supabase-Konto.

### 1. Abhängigkeiten
```bash
npm install
```

### 2. Supabase-Projekt anlegen
Auf https://supabase.com ein neues Projekt erstellen.

### 3. Datenbank aufsetzen
Im Supabase-Dashboard → **SQL Editor** → den kompletten Inhalt von
`supabase/schema.sql` einfügen und ausführen. Das legt alle Tabellen,
die RLS-Policies und die Onboarding-Trigger an.

### 4. E-Mail-Bestätigung ausschalten (nur fürs MVP-Testen)
Supabase → **Authentication → Sign In / Providers → Email** →
„Confirm email" deaktivieren. So kannst du dich sofort ohne
Bestätigungsmail einloggen. (Für den Live-Betrieb später wieder aktivieren.)

### 5. Umgebungsvariablen
`.env.example` nach `.env.local` kopieren und ausfüllen.
Die Werte findest du in Supabase → **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=...        # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # anon public key
SUPABASE_SERVICE_ROLE_KEY=...       # service_role key  (NIE ins Frontend!)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Starten
```bash
npm run dev
```
→ http://localhost:3000

**Testlauf:** Konto erstellen → Betrieb anlegen → Programm anlegen
(z. B. Stempelkarte, 10 Stempel) → Karte an einen Kunden ausgeben →
„+ Stempel" klicken → „Kundenkarte öffnen" → dort siehst du die Karte
mit QR-Code, die sich mit jedem Stempel aktualisiert.

---

## Was funktioniert
- Registrierung / Login / Logout (Supabase Auth)
- Mehrmandantenfähig: jeder Betrieb sieht nur seine eigenen Daten (RLS)
- Betrieb anlegen (Onboarding)
- Treueprogramme: Stempel- oder Punktekarten, Farbe, Logo, Belohnung
- Karten an Kunden ausgeben (mit eindeutiger Serial + QR)
- Stempel / Punkte vergeben, Belohnung einlösen
- Buchungsjournal (`transactions`) für Audit & Missbrauchserkennung
- Öffentliche Kundenkarte unter `/c/<serial>` mit echtem QR-Code

## Was als Nächstes kommt (braucht deine Konten)
- **Apple Wallet** (`app/api/wallet/apple/route.ts`): Apple Developer Account
  (~99 €/Jahr) + Pass-Zertifikat → signierter `.pkpass`
- **Google Wallet** (`app/api/wallet/google/route.ts`): Google-Cloud-Projekt
  + Service Account → signiertes JWT
- **Stripe** (`app/api/stripe/webhook/route.ts`): Abo-Abrechnung
- Automatisches Push-Update der Wallet-Karte beim Stempeln

Diese drei Stellen sind bewusst als klar markierte Platzhalter angelegt,
damit die App ohne sie schon vollständig läuft.

---

## Projektstruktur (Kurzüberblick)

```
app/
  login/                 Login + Registrierung (+ Auth-Actions)
  dashboard/
    layout.tsx           Sidebar-Shell
    page.tsx             Übersicht (Statistiken)
    onboarding/          Ersten Betrieb anlegen
    programs/
      page.tsx           Programme: Liste + Anlegen
      actions.ts         Stempel/Punkte/Einlösen/Karte ausgeben
      [id]/page.tsx      Programm-Detail + Karten verwalten
    customers/           Kundenliste
  c/[serial]/            Öffentliche Kundenkarte (QR)
  api/wallet|stripe/     Referenz-Endpunkte (Live-Ausbau)
lib/supabase/            DB-Clients (server / browser / admin)
lib/org.ts               Aktuelle Organisation ermitteln
components/WalletCard.tsx Darstellung der Wallet-Karte
supabase/schema.sql      Getestetes Datenmodell + RLS + Trigger
middleware.ts            Schützt /dashboard
```

## Deployen (Vercel)
Repo zu Vercel pushen, dieselben Umgebungsvariablen eintragen,
`NEXT_PUBLIC_APP_URL` auf deine echte Domain setzen. Fertig.

## Sicherheit
- Passwörter/Sessions über Supabase Auth
- Row Level Security auf allen Tabellen (getestet: Betrieb A kann Betrieb B
  nicht lesen)
- Service-Role-Key nur serverseitig (öffentliche Karte, Onboarding)
- Übertragung via HTTPS/TLS (Vercel + Supabase)
