import { NextResponse } from "next/server";

// TODO (Live): Stripe-Webhook. Signatur mit STRIPE_WEBHOOK_SECRET prüfen,
// dann bei checkout.session.completed / subscription.updated den plan der
// organization aktualisieren.
export async function POST() {
  return NextResponse.json({ received: true });
}
