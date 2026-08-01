// Zentrale Stelle für alle Firmenangaben, die in Impressum, AGB und
// Datenschutzerklärung wiederverwendet werden (app/impressum, app/agb,
// app/datenschutz) - ein Update hier reicht, statt Text an drei Stellen zu
// pflegen. Die mit [ECKIGEN KLAMMERN] markierten Werte sind Platzhalter und
// MÜSSEN vor dem Livegang durch die echten Firmendaten ersetzt werden -
// siehe Bericht im Chat für die genaue Liste, was noch fehlt.
export const COMPANY = {
  productName: "Matei Loyalty",
  legalName: "[Vollständiger Rechtsname, z. B. Matei Systems GmbH oder Vorname Nachname]",
  legalForm: "[Rechtsform, z. B. Einzelunternehmen / GmbH / UG (haftungsbeschränkt)]",
  street: "[Straße und Hausnummer]",
  postalCode: "[PLZ]",
  city: "[Ort]",
  country: "Deutschland",
  email: "[kontakt@deine-domain.de]",
  phone: "[Telefonnummer, optional]",
  representative: "[Name der vertretungsberechtigten Person, z. B. Geschäftsführer]",
  registerCourt: "[Registergericht, nur falls im Handelsregister eingetragen]",
  registerNumber: "[Handelsregisternummer, nur falls im Handelsregister eingetragen]",
  vatId: "[USt-IdNr. nach §27a UStG, falls vorhanden]",
  contentResponsible: "[Name, verantwortlich für den Inhalt nach §18 Abs. 2 MStV]",
} as const;

export const LEGAL_VERSION = "1.0";
export const LEGAL_LAST_UPDATED = "2026-08-01";
