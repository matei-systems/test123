// Zentrale Stelle für alle Firmenangaben, die in Impressum, AGB,
// Datenschutzerklärung und AVV wiederverwendet werden (app/impressum,
// app/agb, app/datenschutz, app/avv) - ein Update hier reicht, statt Text an
// vier Stellen zu pflegen.
//
// Rechtlicher Rahmen: österreichisches Recht (Sitz in Traun, Oberösterreich)
// - § 5 E-Commerce-Gesetz (ECG) und § 25 Mediengesetz statt des deutschen
// TMG/DDG, Wirtschaftskammer-Pflichtmitgliedschaft statt Handelsregister,
// österreichische Datenschutzbehörde (DSB) statt einer deutschen
// Landesbehörde. registerNumber/vatId bleiben bewusst leer, bis sie
// tatsächlich vorhanden sind (Einzelunternehmen sind i. d. R. nicht im
// Firmenbuch, UID erst ab Überschreiten der Kleinunternehmergrenze bzw.
// freiwilliger Regelbesteuerung) - die Seiten blenden leere Felder aus,
// statt "entfällt" o. Ä. anzuzeigen.
export const COMPANY = {
  productName: "Matei Loyalty",
  legalName: "Raul Matei",
  tradingName: "Matei Systems",
  legalForm: "Einzelunternehmen",
  street: "Gferetfeldstraße 6",
  postalCode: "4050",
  city: "Traun",
  country: "Österreich",
  email: "mateisystems.at@gmail.com",
  phone: "+43 664 1239383",
  representative: "Raul Matei",
  chamberMembership: "Mitglied der Wirtschaftskammer Oberösterreich (WKO)",
  tradeAuthority: "Magistrat der Stadt Traun",
  applicableLaw: "Gewerbeordnung 1994 (GewO), abrufbar unter www.ris.bka.gv.at",
  businessPurpose: "Bereitstellung einer Software-as-a-Service-Plattform für digitale Kundenbindungsprogramme (Treuekarten)",
  registerCourt: "",
  registerNumber: "",
  vatId: "",
  contentResponsible: "Raul Matei",
} as const;

export const LEGAL_VERSION = "1.1";
export const LEGAL_LAST_UPDATED = "2026-08-01";

export const AVV_VERSION = "1.0";
