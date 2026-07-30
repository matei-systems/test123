"use client";

import { useTransition } from "react";
import { openBillingPortal, cancelSubscription, resumeSubscription } from "@/app/dashboard/billing/actions";

export default function BillingActions({
  hasSubscription,
  cancelAtPeriodEnd,
}: {
  hasSubscription: boolean;
  cancelAtPeriodEnd: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const res = await action();
      if (res?.error) alert(res.error);
    });
  }

  if (!hasSubscription) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <button type="button" disabled={pending} onClick={() => run(openBillingPortal)} className="btn btn-ghost text-sm">
        Kundenportal öffnen
      </button>
      {cancelAtPeriodEnd ? (
        <button type="button" disabled={pending} onClick={() => run(resumeSubscription)} className="btn btn-ghost text-sm">
          Kündigung zurücknehmen
        </button>
      ) : (
        <button type="button" disabled={pending} onClick={() => run(cancelSubscription)} className="btn btn-ghost text-sm">
          Abo kündigen
        </button>
      )}
    </div>
  );
}
