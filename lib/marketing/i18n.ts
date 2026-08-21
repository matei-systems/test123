// Übersetzungs-Wörterbuch NUR für die Marketing-Landingpage (siehe
// Nutzer-Entscheidung: App/Dashboard bleiben vorerst Deutsch/dunkel-only).
// Bewusst ein einfaches Objekt statt einer i18n-Bibliothek - für eine
// einzelne Seite mit überschaubarem Textumfang reicht das, ohne zusätzliche
// Abhängigkeit und Routing-Komplexität (kein /en-Pfad nötig).
export type Lang = "de" | "en";

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

export const translations: Record<Lang, Translations> = {
  de: {
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
    footer: {
      impressum: "Impressum",
      datenschutz: "Datenschutz",
      agb: "AGB",
    },
    whatsappText: "Hallo! Ich interessiere mich für Matei Loyalty für meinen Betrieb. Können wir kurz sprechen?",
    emailSubject: "Anfrage: Matei Loyalty",
    emailBody: "Hallo,\n\nich interessiere mich für Matei Loyalty für meinen Betrieb.\n\nMein Betrieb: \nUnsere Frage: \n\nViele Grüße",
  },
  en: {
    nav: { how: "How it works", demo: "Live demo", pricing: "Pricing", login: "Log in", register: "Sign up" },
    hero: {
      eyebrow: "Digital loyalty card",
      h1a: "Turn walk-ins into",
      h1b: "regulars.",
      lead: "Your business's loyalty card – right in your customers' phones. Collect stamps, redeem rewards. No app, no plastic, no paper.",
      ctaPrimary: "Start free for 14 days",
      ctaSecondary: "See live demo",
      note: "Works in Apple Wallet & Google Wallet – already on every phone.",
    },
    trust: ["Cafés", "Salons", "Restaurants", "Bakeries", "Beauty studios"],
    problem: {
      eyebrow: "The problem",
      h2: "Why most loyalty programs fail",
      sub: "Does any of this sound familiar?",
      items: [
        { title: "Here once, never again", body: "Without an incentive, most first-time customers never come back – even though keeping existing customers is cheaper than winning new ones." },
        { title: "Paper cards go missing", body: "Forgotten in a wallet, crumpled, or simply lost – usually right before they're full. An invisible loss of loyalty for you." },
        { title: "No data, no control", body: "You don't know who your best customers are, how often they visit, or whether your last promotion actually worked." },
        { title: "Your own app? Too expensive, too much effort", body: "Building an app costs a multiple of this – and hardly any customer installs a dedicated app for a single business." },
      ],
      solutionEyebrow: "The solution",
      solution: "A loyalty card your customers always have with them – in their phone, not their wallet.",
    },
    how: {
      eyebrow: "It's this simple",
      h2: "Your own loyalty card in three steps",
      sub: "No technical knowledge needed – for you or your customers.",
      steps: [
        { title: "QR stand at the counter", body: "Your customer scans the QR code and the card is in their phone in seconds. No download, no sign-up." },
        { title: "Stamp on every visit", body: "After paying, the customer shows their card, your staff scans it – a stamp or points added, done." },
        { title: "Redeem the reward", body: "Once the card is full, the reward is unlocked. The customer is happy – and comes back for the next one." },
      ],
    },
    demo: {
      eyebrow: "Live demo",
      h2: "See your own card",
      sub: "Enter your business and watch live how the loyalty card looks on your customers' phones.",
      panelTitle: "Design your card",
      nameLabel: "Your business name",
      typeLabel: "Card type",
      typeStamp: "Stamps",
      typePoints: "Points",
      rewardLabel: "Reward",
      colorLabel: "Card color",
      logoLabel: "Custom logo",
      logoUpload: "Upload image",
      logoRemove: "Remove",
      stampIconLabel: "Custom stamp icon",
      stampIconUpload: "Upload image",
      previewCaption: "This is what your customer sees on their phone",
      previewNote: "Preview only – nothing here is saved or uploaded anywhere.",
    },
    benefits: {
      eyebrow: "Why digital",
      h2a: "Paper cards get lost.",
      h2b: "Phones don't.",
      items: [
        { title: "No app needed", body: "Works in Apple Wallet and Google Wallet – already on every customer's phone." },
        { title: "Stamped in 2 seconds", body: "Just scan the code – done. No paperwork, no lost cards anymore." },
        { title: "Customers come back more", body: "A visible goal brings guests back – for the next stamp and the next reward." },
        { title: "Always up to date", body: "New stamp, new reward, new promotion – the card in the phone updates itself automatically." },
      ],
    },
    pricing: {
      eyebrow: "Pricing",
      h2: "Simple & predictable",
      sub: "14 days free trial, then a fixed monthly fee. No hidden costs.",
      popular: "POPULAR",
      perMonth: "/ month",
      cta: "Get started",
      question: "Questions about your plan?",
      questionLink: "Write to us",
    },
    cta: {
      h2: "Ready for your loyalty card?",
      sub: "Your digital customer card is ready in minutes – no technical knowledge needed.",
      primary: "Start for free",
      whatsapp: "Message on WhatsApp",
    },
    footer: {
      impressum: "Legal notice",
      datenschutz: "Privacy",
      agb: "Terms",
    },
    whatsappText: "Hi! I'm interested in Matei Loyalty for my business. Could we talk briefly?",
    emailSubject: "Inquiry: Matei Loyalty",
    emailBody: "Hello,\n\nI'm interested in Matei Loyalty for my business.\n\nMy business: \nOur question: \n\nBest regards",
  },
};
