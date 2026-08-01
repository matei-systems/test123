import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { findPlanByPriceId } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

// Der Stripe-Webhook ist der EINZIGE Schreiber für Abrechnungsfelder auf
// organizations (siehe Kommentar in supabase/schema.sql und lib/org.ts) -
// Server Actions bitten Stripe nur um Änderungen (Checkout, Portal,
// Kündigung), nie um direkte DB-Schreibzugriffe. Das verhindert
// Wettlaufsituationen zwischen einem optimistischen UI-Update und dem, was
// Stripe tatsächlich bestätigt (z. B. eine fehlgeschlagene Zahlung nach
// erfolgreichem Checkout).
//
// org_id kommt für JEDES relevante Event aus event.data.object.metadata -
// gesetzt einmalig bei der Checkout-Session-Erstellung
// (subscription_data.metadata, siehe app/dashboard/billing/actions.ts) und
// bleibt auf dem Stripe-Subscription-Objekt für dessen gesamte Lebensdauer
// erhalten (auch bei späteren Änderungen über das Kundenportal) - dadurch
// braucht der Webhook keine eigene Lookup-Tabelle nach Stripe-Kunden-ID.
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe ist nicht konfiguriert." }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Fehlende Signatur." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: any) {
    console.error("[stripe-webhook] Signaturprüfung fehlgeschlagen:", e.message);
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        if (!orgId) {
          console.error("[stripe-webhook] checkout.session.completed ohne org_id-Metadata:", session.id);
          break;
        }
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        await admin
          .from("organizations")
          .update({
            ...(customerId ? { stripe_customer_id: customerId } : {}),
            ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
          })
          .eq("id", orgId);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id;
        if (!orgId) {
          console.error(`[stripe-webhook] ${event.type} ohne org_id-Metadata:`, sub.id);
          break;
        }
        const item = sub.items.data[0];
        const priceId = item?.price?.id ?? null;
        const found = findPlanByPriceId(priceId);
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        // Seit neueren Stripe-API-Versionen liegt current_period_end auf dem
        // Subscription-Item, nicht mehr auf der Subscription selbst (Stripe
        // erlaubt inzwischen unterschiedliche Abrechnungszyklen pro Position
        // innerhalb eines Abos) - da wir immer genau eine Position pro Abo
        // haben, genügt das erste Item.
        const periodEnd = item?.current_period_end;

        await admin
          .from("organizations")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            stripe_price_id: priceId,
            subscription_status: sub.status,
            plan_id: found?.plan.id ?? null,
            billing_interval: found?.interval ?? null,
            ...(periodEnd ? { current_period_end: new Date(periodEnd * 1000).toISOString() } : {}),
            cancel_at_period_end: sub.cancel_at_period_end,
          })
          .eq("id", orgId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id;
        if (!orgId) {
          console.error("[stripe-webhook] customer.subscription.deleted ohne org_id-Metadata:", sub.id);
          break;
        }
        await admin
          .from("organizations")
          .update({ subscription_status: "canceled", cancel_at_period_end: false })
          .eq("id", orgId);
        break;
      }

      default:
        // Andere Event-Typen (z. B. invoice.*) sind für unsere Zwecke nicht
        // relevant - Rechnungen werden bei Bedarf live von der Stripe-API
        // gelesen (app/dashboard/billing/page.tsx), nicht gespiegelt.
        break;
    }
  } catch (e: any) {
    logError("stripe-webhook", e, { eventType: event.type, eventId: event.id });
    // 500, damit Stripe automatisch erneut zustellt (könnte ein transienter
    // DB-Fehler gewesen sein) - anders als bei fehlender Metadata, wo ein
    // Retry nichts ändern würde.
    return NextResponse.json({ error: "Verarbeitung fehlgeschlagen." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
