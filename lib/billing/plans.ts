// Zentraler Tarif-Katalog. Ein neuer Tarif oder ein neues Intervall
// hinzuzufügen ist ein neuer Eintrag hier plus zwei Umgebungsvariablen
// (Stripe-Preis-IDs) - keine Code-Änderung an Checkout, Webhook oder
// Kundenportal nötig, die lesen alle aus dieser Liste.
export type PlanId = "starter" | "business" | "premium";
export type BillingInterval = "monthly" | "yearly";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  features: string[];
  // Anzeigepreise (EUR/Monat) - unabhängig von Stripe, damit die
  // Preisseite auch ohne konfiguriertes Stripe-Konto vollständig aussieht.
  // Der tatsächlich abgerechnete Betrag kommt immer von Stripe selbst.
  displayPriceMonthly: number;
  displayPriceYearly: number; // Gesamtpreis pro Jahr (üblicherweise mit Rabatt)
  priceIds: Record<BillingInterval, string | undefined>;
}

export const PLANS: PlanDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Für den Einstieg mit einem Standort.",
    features: [
      "1 Standort",
      "Bis zu 3 Treueprogramme",
      "Unbegrenzt Kunden & Karten",
      "Apple & Google Wallet",
    ],
    displayPriceMonthly: 59,
    displayPriceYearly: 590,
    priceIds: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
      yearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
    },
  },
  {
    id: "business",
    name: "Business",
    tagline: "Für wachsende Betriebe mit mehreren Standorten.",
    features: [
      "Bis zu 5 Standorte",
      "Unbegrenzt Treueprogramme",
      "Individuelles Kartendesign",
      "Team-Verwaltung mit Rollen",
      "Apple & Google Wallet",
    ],
    displayPriceMonthly: 119,
    displayPriceYearly: 1190,
    priceIds: {
      monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
      yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
    },
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Für Filialketten mit hohem Kartenvolumen.",
    features: [
      "Unbegrenzt Standorte",
      "Unbegrenzt Treueprogramme",
      "Individuelles Kartendesign",
      "Team-Verwaltung mit Rollen",
      "Priorisierter Support",
      "Apple & Google Wallet",
    ],
    displayPriceMonthly: 249,
    displayPriceYearly: 2490,
    priceIds: {
      monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
    },
  },
];

export function getPlan(id: string | null | undefined): PlanDefinition | undefined {
  return PLANS.find((p) => p.id === id);
}

// Findet den Katalog-Eintrag zu einer Stripe-Preis-ID zurück - der Webhook
// bekommt von Stripe nur die Preis-ID, nicht direkt unseren internen
// plan/interval-Namen.
export function findPlanByPriceId(priceId: string | null | undefined): { plan: PlanDefinition; interval: BillingInterval } | null {
  if (!priceId) return null;
  for (const plan of PLANS) {
    for (const interval of ["monthly", "yearly"] as BillingInterval[]) {
      if (plan.priceIds[interval] === priceId) return { plan, interval };
    }
  }
  return null;
}

export function isPlanAvailable(plan: PlanDefinition, interval: BillingInterval): boolean {
  return Boolean(plan.priceIds[interval]);
}
