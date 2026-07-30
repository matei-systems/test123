import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { computeBillingInfo, ACCESS_REASON_MESSAGE } from "@/lib/billing/access";
import { PLANS } from "@/lib/billing/plans";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import PlanPicker from "@/components/billing/PlanPicker";
import BillingActions from "@/components/billing/BillingActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  trialing: "Testphase",
  active: "Aktiv",
  past_due: "Zahlung überfällig",
  unpaid: "Unbezahlt",
  canceled: "Gekündigt",
  incomplete: "Unvollständig",
  incomplete_expired: "Abgelaufen",
  paused: "Pausiert",
};

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  trialing: { bg: "rgba(232,181,115,0.14)", fg: "#E8B573" },
  active: { bg: "rgba(74,222,128,0.12)", fg: "#86EFAC" },
  past_due: { bg: "rgba(239,68,68,0.12)", fg: "#FCA5A5" },
  unpaid: { bg: "rgba(239,68,68,0.12)", fg: "#FCA5A5" },
  canceled: { bg: "rgba(148,148,148,0.14)", fg: "#C9C4BC" },
};

function fmtDate(d: Date | null): string {
  if (!d) return "-";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function BillingPage({ searchParams }: { searchParams: { checkout?: string } }) {
  const { org, role } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  const billing = computeBillingInfo(org);
  const isOwner = role === "owner";
  const stripeConfigured = isStripeConfigured();
  const hasSubscription = Boolean(org.stripe_subscription_id) && billing.subscriptionStatus !== "canceled";

  let invoices: { id: string; date: Date; amount: string; status: string; url: string | null }[] = [];
  if (stripeConfigured && org.stripe_customer_id) {
    try {
      const list = await getStripe().invoices.list({ customer: org.stripe_customer_id, limit: 5 });
      invoices = list.data.map((inv) => ({
        id: inv.id ?? inv.number ?? "",
        date: new Date((inv.created ?? 0) * 1000),
        amount: `${((inv.amount_paid ?? inv.total ?? 0) / 100).toFixed(2)}€`,
        status: inv.status ?? "unknown",
        url: inv.hosted_invoice_url ?? null,
      }));
    } catch (e: any) {
      console.error("[billing] Rechnungen konnten nicht geladen werden:", e.message);
    }
  }

  const statusKey = billing.subscriptionStatus ?? (billing.state === "active" ? "trialing" : "trial_expired");
  const statusLabel = STATUS_LABEL[statusKey] ?? (billing.state === "active" ? "Testphase" : "Nicht abonniert");
  const statusColor = STATUS_COLOR[statusKey] ?? STATUS_COLOR.canceled;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Abrechnung</h1>
        <p className="text-[#A6A099] text-sm">Tarif, Testphase und Rechnungen deines Betriebs</p>
      </div>

      {searchParams?.checkout === "success" && (
        <div className="mb-5 text-sm rounded-lg px-3 py-2.5" style={{ background: "rgba(74,222,128,0.1)", color: "#86EFAC" }}>
          Danke! Dein Abo wird in Kürze aktiviert.
        </div>
      )}

      {!stripeConfigured && (
        <div className="mb-5 text-sm rounded-lg px-3 py-2.5" style={{ background: "rgba(232,181,115,0.12)", color: "#E8B573" }}>
          Zahlungen sind noch nicht eingerichtet - die Tarife sind bereits vollständig vorbereitet und werden automatisch aktiv,
          sobald ein Stripe-Konto hinterlegt ist.
        </div>
      )}

      {billing.state === "restricted" && (
        <div className="mb-5 text-sm rounded-lg px-3 py-2.5" style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
          {ACCESS_REASON_MESSAGE[billing.reason]}
        </div>
      )}

      <div className="card p-6 mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wide text-faint mb-1">Aktueller Status</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{billing.plan ? billing.plan.name : "Kein Tarif"}</span>
              <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: statusColor.bg, color: statusColor.fg }}>
                {statusLabel}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-faint">
            {billing.reason === "trialing_app" || billing.reason === "trialing_stripe" ? (
              <div>
                Testphase endet am <span className="text-[#F4F1EC] font-medium">{fmtDate(billing.trialEndsAt)}</span>
                {billing.daysLeftInTrial !== null && billing.daysLeftInTrial >= 0 && (
                  <span> ({billing.daysLeftInTrial} {billing.daysLeftInTrial === 1 ? "Tag" : "Tage"})</span>
                )}
              </div>
            ) : billing.currentPeriodEnd ? (
              <div>
                {billing.cancelAtPeriodEnd ? "Endet am " : "Nächste Abrechnung am "}
                <span className="text-[#F4F1EC] font-medium">{fmtDate(billing.currentPeriodEnd)}</span>
              </div>
            ) : null}
          </div>
        </div>

        {isOwner ? (
          <BillingActions hasSubscription={hasSubscription} cancelAtPeriodEnd={billing.cancelAtPeriodEnd} />
        ) : (
          <div className="text-xs text-faint mt-4">Nur der Inhaber kann das Abo verwalten.</div>
        )}
      </div>

      {isOwner && (
        <div className="mb-8">
          <h2 className="text-lg font-bold tracking-tight mb-4">Tarif wählen</h2>
          <PlanPicker
            plans={PLANS}
            currentPlanId={billing.plan?.id ?? null}
            currentInterval={billing.interval}
            hasActiveSubscription={hasSubscription}
            stripeConfigured={stripeConfigured}
          />
        </div>
      )}

      {invoices.length > 0 && (
        <div>
          <h2 className="text-lg font-bold tracking-tight mb-4">Rechnungen</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/[0.06] last:border-b-0">
                    <td className="p-4 text-faint">{fmtDate(inv.date)}</td>
                    <td className="p-4 font-medium">{inv.amount}</td>
                    <td className="p-4 text-faint capitalize">{inv.status}</td>
                    <td className="p-4 text-right">
                      {inv.url && (
                        <a href={inv.url} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-bright hover:underline">
                          Ansehen ↗
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
