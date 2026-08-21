// Zentrale Text-Sammlung für die Marketing-Landingpage - ein Objekt statt
// über die Komponenten verstreuter String-Literale, damit Copy an einer
// Stelle gepflegt wird. (Ursprünglich mehrsprachig angelegt, auf
// ausdrücklichen Wunsch wieder auf Deutsch-only reduziert.)
interface TextItem {
  title: string;
  body: string;
}

export interface Translations {
  nav: { how: string; demo: string; pricing: string; login: string; register: string };
  hero: { eyebrow: string; h1a: string; h1b: string; lead: string; ctaPrimary: string; ctaSecondary: string; note: string };
  trust: string[];
  problem: { eyebrow: string; h2: string; sub: string; items: TextItem[]; solutionEyebrow: string; solution: string };
  how: { eyebrow: string; h2: string; sub: string; steps: TextItem[] };
  demo: {
    eyebrow: string;
    h2: string;
    sub: string;
    panelTitle: string;
    nameLabel: string;
    typeLabel: string;
    typeStamp: string;
    typePoints: string;
    rewardLabel: string;
    baseModeLabel: string;
    baseModeGradient: string;
    baseModeColor: string;
    gradientFromLabel: string;
    gradientToLabel: string;
    colorLabel: string;
    logoLabel: string;
    logoUpload: string;
    logoRemove: string;
    stampIconLabel: string;
    stampIconUpload: string;
    previewCaption: string;
    previewNote: string;
  };
  benefits: { eyebrow: string; h2a: string; h2b: string; items: TextItem[] };
  pricing: { eyebrow: string; h2: string; sub: string; popular: string; perMonth: string; cta: string; question: string; questionLink: string };
  cta: { h2: string; sub: string; primary: string; whatsapp: string };
  footer: { impressum: string; datenschutz: string; agb: string };
  whatsappText: string;
  emailSubject: string;
  emailBody: string;
}

export const t: Translations = {
  nav: { how: "So funktioniert's", demo: "Live-Demo", pricing: "Preise", login: "Anmelden", register: "Registrieren" },
  hero: {
    eyebrow: "Digitale Treuekarte",
    h1a: "Aus Laufkundschaft werden",
    h1b: "Stammgäste.",
    lead: "Die Treuekarte deines Betriebs – direkt im Handy deiner Kunden. Stempel sammeln, Belohnungen einlösen. Ganz ohne App, ohne Plastik, ohne Papier.",
    ctaPrimary: "14 Tage kostenlos starten",
    ctaSecondary: "Live-Demo ansehen",
    note: "Läuft in Apple Wallet & Google Wallet – schon auf jedem Handy.",
  },
  trust: ["Cafés", "Friseure", "Restaurants", "Bäckereien", "Kosmetikstudios"],
  problem: {
    eyebrow: "Das Problem",
    h2: "Warum die meisten Stammkundenprogramme scheitern",
    sub: "Kommt dir davon etwas bekannt vor?",
    items: [
      { title: "Einmal da, nie wieder", body: "Ohne Anreiz kommen die meisten Erstkunden kein zweites Mal – dabei ist es günstiger, bestehende Kunden zu halten, als neue zu gewinnen." },
      { title: "Papierkarten verschwinden", body: "Im Portemonnaie vergessen, verknittert oder einfach verloren – meist genau bevor sie voll sind. Für dich unsichtbarer Schwund an Kundenbindung." },
      { title: "Keine Daten, keine Kontrolle", body: "Du weißt nicht, wer deine besten Kunden sind, wie oft sie kommen oder ob deine letzte Aktion überhaupt etwas gebracht hat." },
      { title: "Eine eigene App? Zu teuer, zu viel Aufwand", body: "Eine App entwickeln zu lassen kostet ein Vielfaches – und kaum ein Kunde lädt sich eine eigene App für einen einzelnen Betrieb herunter." },
    ],
    solutionEyebrow: "Die Lösung",
    solution: "Eine Treuekarte, die deine Kunden immer dabeihaben – im Handy, nicht im Portemonnaie.",
  },
  how: {
    eyebrow: "So einfach geht's",
    h2: "In drei Schritten zur eigenen Treuekarte",
    sub: "Kein technisches Wissen nötig – für dich und für deine Kunden.",
    steps: [
      { title: "QR-Aufsteller am Tresen", body: "Dein Kunde scannt den QR-Code und legt die Karte in Sekunden in sein Handy. Kein Download, keine Anmeldung." },
      { title: "Bei jedem Besuch stempeln", body: "Nach dem Bezahlen zeigt der Kunde seine Karte, dein Team scannt sie kurz – ein Stempel oder Punkte drauf, fertig." },
      { title: "Belohnung einlösen", body: "Ist die Karte voll, gibt's die Belohnung. Der Kunde freut sich – und kommt für die nächste wieder." },
    ],
  },
  demo: {
    eyebrow: "Live-Demo",
    h2: "Sieh deine eigene Karte",
    sub: "Gib deinen Betrieb ein und schau live zu, wie die Treuekarte im Handy deiner Kunden aussieht.",
    panelTitle: "Deine Karte gestalten",
    nameLabel: "Name deines Betriebs",
    typeLabel: "Karten-Typ",
    typeStamp: "Stempel",
    typePoints: "Punkte",
    rewardLabel: "Belohnung",
    baseModeLabel: "Kartenhintergrund",
    baseModeGradient: "Verlauf",
    baseModeColor: "Farbe",
    gradientFromLabel: "Farbe von",
    gradientToLabel: "Farbe bis",
    colorLabel: "Kartenfarbe",
    logoLabel: "Eigenes Logo",
    logoUpload: "Bild hochladen",
    logoRemove: "Entfernen",
    stampIconLabel: "Eigenes Stempel-Icon",
    stampIconUpload: "Bild hochladen",
    previewCaption: "So sieht's im Handy deines Kunden aus",
    previewNote: "Nur zur Vorschau – nichts davon wird gespeichert oder hochgeladen.",
  },
  benefits: {
    eyebrow: "Warum digital",
    h2a: "Papierkarten gehen verloren.",
    h2b: "Das Handy nicht.",
    items: [
      { title: "Keine App nötig", body: "Läuft in Apple Wallet und Google Wallet – die jeder Kunde schon auf dem Handy hat." },
      { title: "In 2 Sekunden gestempelt", body: "Kurz den Code scannen – fertig. Kein Papierkram, keine verlorenen Kärtchen mehr." },
      { title: "Kunden kommen öfter", body: "Ein Ziel vor Augen bringt Gäste zurück – für den nächsten Stempel und die nächste Belohnung." },
      { title: "Immer aktuell", body: "Neuer Stempel, neue Belohnung, neue Aktion – die Karte im Handy aktualisiert sich von selbst." },
    ],
  },
  pricing: {
    eyebrow: "Preise",
    h2: "Einfach & planbar",
    sub: "14 Tage kostenlos testen, danach ein fixer Monatsbeitrag. Keine versteckten Kosten.",
    popular: "BELIEBT",
    perMonth: "/ Monat",
    cta: "Jetzt starten",
    question: "Fragen zu deinem Tarif?",
    questionLink: "Schreib uns",
  },
  cta: {
    h2: "Bereit für deine Treuekarte?",
    sub: "In wenigen Minuten ist deine digitale Kundenkarte startklar – kein technisches Wissen nötig.",
    primary: "Jetzt kostenlos starten",
    whatsapp: "WhatsApp schreiben",
  },
  footer: { impressum: "Impressum", datenschutz: "Datenschutz", agb: "AGB" },
  whatsappText: "Hallo! Ich interessiere mich für Matei Loyalty für meinen Betrieb. Können wir kurz sprechen?",
  emailSubject: "Anfrage: Matei Loyalty",
  emailBody: "Hallo,\n\nich interessiere mich für Matei Loyalty für meinen Betrieb.\n\nMein Betrieb: \nUnsere Frage: \n\nViele Grüße",
};
