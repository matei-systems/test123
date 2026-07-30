import Stripe from "stripe";

// Stripe braucht einen echten Account (Secret Key + Webhook-Secret) - bis
// diese Variablen gesetzt sind, bleibt die Integration inaktiv. Der Code ist
// fertig und wird automatisch scharf, sobald die Umgebungsvariablen
// hinterlegt sind (gleiches Muster wie Apple/Google Wallet, siehe
// lib/apple-wallet.ts / lib/google-wallet.ts).
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

let cached: Stripe | null = null;

// Einmalig instanziierter Client (Stripes SDK hält intern einen HTTP-
// Connection-Pool - ein Singleton statt "new Stripe()" pro Aufruf spart
// unnötige Verbindungsaufbauten).
export function getStripe(): Stripe {
  if (!cached) {
    // Keine explizite apiVersion: das SDK nutzt automatisch die zu dieser
    // SDK-Version passende, gebündelte Stripe-API-Version - so bleibt der
    // Code auch nach einem "npm update stripe" ohne manuelle Anpassung
    // gültig.
    cached = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_not_configured");
  }
  return cached;
}
