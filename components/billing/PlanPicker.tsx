"use client";

import { useState, useTransition } from "react";
import type { PlanDefinition, BillingInterval } from "@/lib/billing/plans";
import { createCheckoutSession, changePlan } from "@/app/dashboard/billing/actions";

export default function PlanPicker({
  plans,
  currentPlanId,
  currentInterval,
  hasActiveSubscription,
  stripeConfigured,
}: {
  plans: PlanDefinition[];
  currentPlanId: string | null;
  currentInterval: BillingInterval | null;
  hasActiveSubscription: boolean;
  stripeConfigured: boolean;
}) {
  const [interval, setInterval] = useState<BillingInterval>(currentInterval ?? "monthly");
  const [pending, startTransition] = useTransition();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function choose(planId: PlanDefinition["id"]) {
    setError(null);
    setBusyPlan(planId);
    startTransition(async () => {
      const action = hasActiveSubscription ? changePlan : createCheckoutSession;
      const res = await action(planId, interval);
      if (res?.error) setError(res.error);
      setBusyPlan(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-1 mb-6 mx-auto w-fit bg-ink border border-line rounded-xl p-1">
        {(["monthly", "yearly"] as BillingInterval[]).map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInterval(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              interval === i ? "bg-white/[0.08] text-[#F4F1EC]" : "text-faint hover:text-[#F4F1EC]"
            }`}
          >
            {i === "monthly" ? "Monatlich" : "Jährlich (2 Monate gratis)"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-5 text-sm rounded-lg px-3 py-2.5 max-w-md mx-auto" style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const available = Boolean(plan.priceIds[interval]);
          const isCurrent = plan.id === currentPlanId && interval === currentInterval;
          const price = interval === "monthly" ? plan.displayPriceMonthly : Math.round(plan.displayPriceYearly / 12);
          const busy = pending && busyPlan === plan.id;

          return (
            <div key={plan.id} className={`card p-6 flex flex-col ${isCurrent ? "ring-2 ring-gold" : ""}`}>
              <div className="text-lg font-bold mb-1">{plan.name}</div>
              <div className="text-sm text-faint mb-4">{plan.tagline}</div>
              <div className="mb-4">
                <span className="text-3xl font-extrabold">{price}€</span>
                <span className="text-sm text-faint"> / Monat</span>
                {interval === "yearly" && (
                  <div className="text-xs text-faint mt-1">{plan.displayPriceYearly}€ jährlich abgerechnet</div>
                )}
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm flex items-start gap-2">
                    <span className="text-gold-bright shrink-0 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => choose(plan.id)}
                disabled={!stripeConfigured || !available || isCurrent || busy}
                className={`btn ${isCurrent ? "btn-ghost" : "btn-primary"} w-full text-sm`}
              >
                {isCurrent
                  ? "Aktueller Tarif"
                  : busy
                  ? "Wird verarbeitet…"
                  : !stripeConfigured || !available
                  ? "Bald verfügbar"
                  : hasActiveSubscription
                  ? "Wechseln"
                  : "Abonnieren"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
