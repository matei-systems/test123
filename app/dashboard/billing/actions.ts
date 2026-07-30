"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/org";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getPlan, isPlanAvailable, type BillingInterval, type PlanId } from "@/lib/billing/plans";

// Alle Aktionen hier bitten Stripe nur um Änderungen - keine schreibt
// jemals selbst Abrechnungsfelder in die DB (das macht ausschließlich der
// Webhook, siehe app/api/stripe/webhook/route.ts). Deshalb auch immer
// { requireActive: false }: ein eingeschränkter Betrieb muss sich über
// genau diese Aktionen wieder freischalten können.

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "";
}

// Neues Abo abschließen (noch keine Stripe-Subscription vorhanden). Der
// verbleibende App-Trial (falls vorhanden) wird 1:1 als Stripe-Trial
// übernommen, damit niemand doppelt "verliert" - wer schon 10 Tage seines
// kostenlosen Zeitraums verbraucht hat, bekommt bei Stripe nur noch die
// verbleibenden 4 Tage, nicht erneut 14.
export async function createCheckoutSession(planId: PlanId, interval: BillingInterval): Promise<{ error?: string }> {
  const gate = await requireOrgRole("owner", { requireActive: false });
  if (!gate.ok) return { error: gate.error };
  if (!isStripeConfigured()) return { error: "Zahlungen sind noch nicht eingerichtet. Bitte wende dich an den Betreiber." };

  const plan = getPlan(planId);
  if (!plan || !isPlanAvailable(plan, interval)) return { error: "Dieser Tarif ist aktuell nicht verfügbar." };
  const priceId = plan.priceIds[interval]!;

  const { org, user } = gate;
  const daysLeft = org.trial_ends_at ? Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86_400_000) : 0;
  const trialDays = !org.subscription_status && daysLeft > 0 ? daysLeft : undefined;

  let session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(org.stripe_customer_id ? { customer: org.stripe_customer_id } : { customer_email: user.email ?? undefined }),
      subscription_data: {
        metadata: { org_id: org.id },
        ...(trialDays ? { trial_period_days: trialDays } : {}),
      },
      metadata: { org_id: org.id },
      success_url: `${appUrl()}/dashboard/billing?checkout=success`,
      cancel_url: `${appUrl()}/dashboard/billing?checkout=cancelled`,
      allow_promotion_codes: true,
    });
  } catch (e: any) {
    console.error("[billing] Checkout-Session konnte nicht erstellt werden:", e.message);
    return { error: "Zahlung konnte nicht gestartet werden. Bitte versuche es erneut." };
  }

  if (!session.url) return { error: "Zahlung konnte nicht gestartet werden." };
  redirect(session.url);
}

// Tarifwechsel bei bestehendem Abo (Upgrade/Downgrade) - direkt per API
// statt über das Kundenportal, für eine im Produkt integrierte Wechsel-
// Erfahrung. Stripe berechnet die Proration automatisch. Die DB wird NICHT
// hier aktualisiert, sondern kurz danach durch das resultierende
// customer.subscription.updated-Webhook-Event - die Seite zeigt den neuen
// Stand daher ggf. erst nach einem Moment / Neuladen an.
export async function changePlan(planId: PlanId, interval: BillingInterval): Promise<{ error?: string }> {
  const gate = await requireOrgRole("owner", { requireActive: false });
  if (!gate.ok) return { error: gate.error };
  if (!isStripeConfigured()) return { error: "Zahlungen sind noch nicht eingerichtet." };

  const { org } = gate;
  if (!org.stripe_subscription_id) return { error: "Kein aktives Abo gefunden. Bitte schließe zuerst ein Abo ab." };

  const plan = getPlan(planId);
  if (!plan || !isPlanAvailable(plan, interval)) return { error: "Dieser Tarif ist aktuell nicht verfügbar." };
  const priceId = plan.priceIds[interval]!;

  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
    const itemId = sub.items.data[0]?.id;
    if (!itemId) return { error: "Abo-Position nicht gefunden." };
    await stripe.subscriptions.update(org.stripe_subscription_id, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "create_prorations",
    });
  } catch (e: any) {
    console.error("[billing] Tarifwechsel fehlgeschlagen:", e.message);
    return { error: "Tarifwechsel fehlgeschlagen. Bitte versuche es erneut." };
  }

  revalidatePath("/dashboard/billing");
  return {};
}

// Kündigung zum Ende der aktuellen Abrechnungsperiode (nicht sofort) -
// üblicher Standard, der Betrieb behält vollen Zugriff bis zum bereits
// bezahlten Periodenende statt sofortiger Sperrung/Rückerstattung.
export async function cancelSubscription(): Promise<{ error?: string }> {
  const gate = await requireOrgRole("owner", { requireActive: false });
  if (!gate.ok) return { error: gate.error };
  if (!isStripeConfigured()) return { error: "Zahlungen sind noch nicht eingerichtet." };

  const { org } = gate;
  if (!org.stripe_subscription_id) return { error: "Kein aktives Abo gefunden." };

  try {
    await getStripe().subscriptions.update(org.stripe_subscription_id, { cancel_at_period_end: true });
  } catch (e: any) {
    console.error("[billing] Kündigung fehlgeschlagen:", e.message);
    return { error: "Kündigung fehlgeschlagen. Bitte versuche es erneut." };
  }

  revalidatePath("/dashboard/billing");
  return {};
}

// Macht eine zum Periodenende geplante Kündigung rückgängig, solange die
// Periode noch nicht abgelaufen ist.
export async function resumeSubscription(): Promise<{ error?: string }> {
  const gate = await requireOrgRole("owner", { requireActive: false });
  if (!gate.ok) return { error: gate.error };
  if (!isStripeConfigured()) return { error: "Zahlungen sind noch nicht eingerichtet." };

  const { org } = gate;
  if (!org.stripe_subscription_id) return { error: "Kein aktives Abo gefunden." };

  try {
    await getStripe().subscriptions.update(org.stripe_subscription_id, { cancel_at_period_end: false });
  } catch (e: any) {
    console.error("[billing] Kündigung konnte nicht zurückgenommen werden:", e.message);
    return { error: "Aktion fehlgeschlagen. Bitte versuche es erneut." };
  }

  revalidatePath("/dashboard/billing");
  return {};
}

// Stripes gehostetes Kundenportal: Zahlungsmethode aktualisieren,
// Rechnungshistorie, und (falls im Stripe-Dashboard aktiviert) ebenfalls
// Tarifwechsel/Kündigung als Selbstbedienungs-Alternative zu den obigen
// Aktionen.
export async function openBillingPortal(): Promise<{ error?: string }> {
  const gate = await requireOrgRole("owner", { requireActive: false });
  if (!gate.ok) return { error: gate.error };
  if (!isStripeConfigured()) return { error: "Zahlungen sind noch nicht eingerichtet." };

  const { org } = gate;
  if (!org.stripe_customer_id) return { error: "Noch kein Zahlungskonto vorhanden. Bitte schließe zuerst ein Abo ab." };

  let session;
  try {
    session = await getStripe().billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${appUrl()}/dashboard/billing`,
    });
  } catch (e: any) {
    console.error("[billing] Kundenportal-Session fehlgeschlagen:", e.message);
    return { error: "Kundenportal konnte nicht geöffnet werden." };
  }

  redirect(session.url);
}
