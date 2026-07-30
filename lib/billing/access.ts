import { getPlan, type PlanDefinition, type BillingInterval } from "@/lib/billing/plans";

// Reine Funktion ohne DB-/Netzwerkzugriff - bekommt nur die Abrechnungsfelder
// der Organisation (die getCurrentOrg() über "organizations(*)" ohnehin
// schon mitlädt) und leitet daraus ab, ob der Betrieb vollen Zugriff hat.
// Läuft identisch in Server Components und Server Actions.
export interface OrgBillingFields {
  subscription_status: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  plan_id: string | null;
  billing_interval: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export type AccessState = "active" | "restricted";

// Warum genau der Zustand so ist - für Banner-/Fehlertexte, nicht für die
// eigentliche Zugriffsentscheidung (die hängt nur an "state").
export type AccessReason =
  | "trialing_app" // Test-Zeitraum seit Anmeldung, noch nie abonniert
  | "trialing_stripe" // Echtes Stripe-Abo, aber noch in dessen Trial-Phase
  | "active"
  | "trial_expired" // App-Trial abgelaufen, nie abonniert
  | "payment_issue" // past_due / unpaid / incomplete
  | "canceled";

export interface BillingInfo {
  state: AccessState;
  reason: AccessReason;
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
  daysLeftInTrial: number | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  plan: PlanDefinition | null;
  interval: BillingInterval | null;
}

export function computeBillingInfo(org: OrgBillingFields): BillingInfo {
  const now = Date.now();
  const trialEndsAt = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const currentPeriodEnd = org.current_period_end ? new Date(org.current_period_end) : null;
  const cancelAtPeriodEnd = Boolean(org.cancel_at_period_end);
  const status = org.subscription_status;
  const plan = getPlan(org.plan_id) ?? null;
  const interval = (org.billing_interval as BillingInterval | null) ?? null;
  const daysLeftInTrial = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - now) / 86_400_000) : null;

  const base = { subscriptionStatus: status, trialEndsAt, currentPeriodEnd, cancelAtPeriodEnd, plan, interval };

  // Noch nie abonniert (kein Stripe-Status vorhanden) -> ausschließlich der
  // interne App-Trial ab Betriebs-Anlage entscheidet.
  if (!status) {
    if (trialEndsAt && trialEndsAt.getTime() > now) {
      return { ...base, state: "active", reason: "trialing_app", daysLeftInTrial };
    }
    return { ...base, state: "restricted", reason: "trial_expired", daysLeftInTrial };
  }

  if (status === "trialing") {
    return { ...base, state: "active", reason: "trialing_stripe", daysLeftInTrial };
  }
  if (status === "active") {
    return { ...base, state: "active", reason: "active", daysLeftInTrial: null };
  }
  if (status === "past_due" || status === "unpaid" || status === "incomplete") {
    return { ...base, state: "restricted", reason: "payment_issue", daysLeftInTrial: null };
  }
  // canceled | incomplete_expired | paused | unbekannt
  return { ...base, state: "restricted", reason: "canceled", daysLeftInTrial: null };
}

export function isTrialEndingSoon(info: BillingInfo): boolean {
  return (
    (info.reason === "trialing_app" || info.reason === "trialing_stripe") &&
    info.daysLeftInTrial !== null &&
    info.daysLeftInTrial <= 3
  );
}

export const ACCESS_REASON_MESSAGE: Record<AccessReason, string> = {
  trialing_app: "Du befindest dich in der kostenlosen Testphase.",
  trialing_stripe: "Du befindest dich in der kostenlosen Testphase.",
  active: "Dein Abo ist aktiv.",
  trial_expired:
    "Deine 14-tägige Testphase ist abgelaufen. Bitte wähle einen Tarif, um weiter Stempel zu vergeben, Karten auszugeben und dein Team zu verwalten.",
  payment_issue:
    "Deine letzte Zahlung ist fehlgeschlagen. Bitte aktualisiere deine Zahlungsmethode, um deinen Account wieder freizuschalten.",
  canceled:
    "Dein Abo ist beendet. Bitte wähle einen Tarif, um weiter Stempel zu vergeben, Karten auszugeben und dein Team zu verwalten.",
};
