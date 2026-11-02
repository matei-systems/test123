# Designsystem Matei Systems

Das visuelle Konzept wurde in **Canva** erstellt (Canva-KI-Generierung nach einem von mir verfassten Briefing,
Konto des Projektinhabers) und anschließend als echter Code umgesetzt. Die Website verwendet keine Canva-Bilder
als Seiteninhalt – Canva war die Designvorlage, alles Sichtbare ist HTML/CSS.

## Canva-Designs

| Design | Inhalt | Link (Bearbeiten) |
|--------|--------|-------------------|
| Markenleitfaden (18 Seiten) | Markenidee, Logo, Farben, Typografie, Raster, Komponenten, Bildsprache, Tonalität | https://www.canva.com/d/4cP3zJtkPW4rEPY |
| Website / Landingpage (Desktop) | Aufbau der Startseite | https://www.canva.com/d/hlAFymHrZcl1EaZ |
| App-Screens (5 Seiten) | Wallet, Kartendetail, Geschäfte entdecken, Scanner, Geschäfts-Übersicht | https://www.canva.com/d/kDoybadHOEa-kSO |
| Tresen-Aufsteller (A5) | Druckvorlage „Sammle bei uns Treuepunkte" | https://www.canva.com/d/fSWhO_-dD8lMOwc |

Bekannte KI-Tippfehler in den Canva-Dateien (nicht automatisch korrigiert, um nichts ungefragt in deinem
Canva-Konto zu speichern): Markenleitfaden „Frances" → „Fraunces", Fußzeilen „Treu, die bleibt" /
„Freue, die bleibt" → „Treue, die bleibt"; Landingpage „Ohne App-Download, eine Papierkarte" → „ohne Papierkarte".

## Markenidee

„Treue, die bleibt." – warm, lokal, ehrlich, hochwertig. Leitmotiv: runder Stempel/Siegel, Treuekarte mit
Ticket-Kante, runder Text-Stempel („Treue zahlt sich aus").

## Farben (Tokens in `app/globals.css`, Tailwind-Namen in Klammern)

| Rolle | Hell | Dunkel | Hinweis |
|-------|------|--------|---------|
| Hintergrund (`paper`) | `#FAF6EF` | `#14110F` | |
| Fläche (`surface`) | `#FFFFFF` | `#1E1A17` | Karten |
| Text (`ink`) | `#14110F` | `#F5EFE6` | 18:1 auf Papier |
| Gedämpft (`muted`) | `#574E45` | `#B3A898` | 7,6:1 bzw. 8:1 |
| Akzent-Text (`amber-700`) | `#8A5A1F` | `#E0A458` | 5,5:1 bzw. 8,6:1 |
| Akzent-Fläche (`amber-600`) | `#9C5A18` | `#E0A458` | weißer Text 5,4:1 |
| Stempel (`stamp`) | `#C07A2C` | `#E0A458` | Grafik ≥ 3:1 |
| Vertrauen/Erfolg (`forest`) | `#1F5A45` | `#5FB892` | weißer Text 8,1:1 |
| Fehler (`danger`) | `#B42318` | `#F97066` | |

## Typografie

- Überschriften: **Fraunces** (Serif, über `next/font` selbst gehostet)
- Text & Bedienelemente: **Inter**, Ziffern für Punktestände tabellarisch (`tabular-nums`)
- Skala: Display 56 / H1 40 / H2 32 / H3 22 / Text 17 / Klein 14 / Beschriftung 12 (mobil reduziert)

## Raster & Form

4-px-Grundraster, Abschnittsabstand 96 px Desktop / 64 px mobil, Karten 20 px Radius, Buttons und Chips
vollständig abgerundet, Touch-Flächen mindestens 44 px.

## Umsetzung im Code

- **Tokens:** `app/globals.css` (`:root` hell, `.dark` dunkel) und `tailwind.config.ts` (`paper`, `surface`, `fg`, `muted`,
  `faint`, `accent`, `accent-strong`, `stamp`, `forest`, `danger`, `warn`, `info`, `line`). Frühere Namen (`ink`, `dim`,
  `gold` …) sind Aliase auf dieselben Rollen, dadurch folgt die gesamte bestehende App dem neuen Design.
- **Klassen:** `.btn` (`-primary`, `-dark`, `-forest`, `-ghost`, `-soft`, `-danger`, `-sm`, `-lg`), `.card`, `.card-flat`,
  `.chip`, `.badge-*`, `.ticket` (Belohnungs-Ticket mit Stanzkante), `.input`/`.label`/`.hint`, `.eyebrow`, `.skeleton`.
- **Komponenten:** `components/ui/Logo.tsx` (Stempel-Logo + Wortmarke), `ThemeToggle`, `useColorScheme`;
  `components/site/Illustrations.tsx` (Text-Stempel, Handy-Stempelkarte, Wallet-Liste, Ring-Schritte);
  `components/konto/WalletCardView.tsx` (Stempelraster, Fortschritt, Kartenkopf im Design des Geschäfts).

## Wo welcher Canva-Entwurf umgesetzt ist

| Canva-Entwurf | Umsetzung |
|---|---|
| Markenleitfaden | Farben, Schriften, Abstände, Logo, Text-Stempel, Ticket-Kante (siehe oben) |
| Website / Landingpage | `app/page.tsx`: Leitsatz-Hero mit zwei Einstiegen, Handy mit Stempelkarte, Ring-Schritte, Vorteile, ehrlicher Partner-Platzhalter, FAQ, dunkle Abschlussfläche |
| App-Screens | Wallet-Liste + Tab-Leiste (`/konto`), Kartendetail mit Stempelraster, QR-Feld und Belohnungs-Tickets (`/konto/karten/[id]`), Geschäfte entdecken mit Suche, Chips und Ortsauswahl (`/geschaefte`), Scanner mit grünem Kopf und „+1 Stempel“ (`/dashboard/scan`), Geschäftsübersicht mit Prüfstatus und Schnellzugriffen (`/dashboard`) |
| Tresen-Aufsteller (A5) | Druckvorlage `/poster/[programId]` mit echtem Beitritts-QR, Text-Stempel und drei Schritten |

Bewusste Abweichungen: Die Kennzahlen im Canva-Screen „Geschäftsübersicht“ waren Beispielwerte; im Dashboard stehen
ausschließlich echte Zahlen aus der Datenbank (bei fehlenden Daten ein leerer Zustand). Die Beispielkarte auf der
Startseite ist sichtbar als „Beispiel“ gekennzeichnet.

## Barrierefreiheit

Kontraste nach WCAG AA (Text) bzw. 3:1 (Grafik), sichtbarer Fokusring, `prefers-reduced-motion` wird respektiert,
semantische Überschriften, Formularfelder mit Labels, Dunkelmodus über Systemeinstellung oder Umschalter.
