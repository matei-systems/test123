import Link from "next/link";
import { isTrialEndingSoon, ACCESS_REASON_MESSAGE, type BillingInfo } from "@/lib/billing/access";

// Serverseitig gerendert (keine Interaktivität nötig) - erscheint über
// jeder Dashboard-Seite, damit auch Mitarbeiter ohne Zugriff auf
// /dashboard/billing verstehen, warum z. B. "+ Stempel" nicht mehr
// funktioniert, statt nur eine unerklärte Fehlermeldung zu sehen.
export default function BillingBanner({ billing }: { billing: BillingInfo }) {
  if (billing.state === "restricted") {
    return (
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap text-sm rounded-lg px-4 py-3" style={{ background: "rgb(var(--danger) / 0.1)", color: "rgb(var(--danger))" }}>
        <span>{ACCESS_REASON_MESSAGE[billing.reason]}</span>
        <Link href="/dashboard/billing" className="font-semibold underline shrink-0">
          Zur Abrechnung
        </Link>
      </div>
    );
  }

  if (isTrialEndingSoon(billing)) {
    return (
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap text-sm rounded-lg px-4 py-3" style={{ background: "rgb(var(--accent-strong) / 0.1)", color: "rgb(var(--accent))" }}>
        <span>
          Deine Testphase endet in {billing.daysLeftInTrial} {billing.daysLeftInTrial === 1 ? "Tag" : "Tagen"}.
        </span>
        <Link href="/dashboard/billing" className="font-semibold underline shrink-0">
          Tarif wählen
        </Link>
      </div>
    );
  }

  return null;
}
