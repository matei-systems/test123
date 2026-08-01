"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

// Eigene, zustandsbehaftete Komponente statt eines einfachen
// ServerActionForm pro Richtung: der Wechsel zwischen "gesperrt" (Banner)
// und "nicht gesperrt" (Sperr-Formular) tauscht komplett unterschiedliche
// Elementbäume aus (<div> <-> <details>). Ein reines router.refresh() nach
// der Server Action zeigt diesen Wechsel im lokalen Dev-Server manchmal erst
// mit spürbarer Verzögerung an (Next.js' Nachbearbeitung des RSC-Streams
// nach einer Server Action ist hier beobachtbar nicht sofort deterministisch) -
// daher hält diese Komponente den Sperr-Status zusätzlich als lokalen State,
// der bei Erfolg SOFORT umgeschaltet wird. router.refresh() läuft trotzdem
// im Hintergrund mit, damit z. B. der Admin-Verlauf weiter unten aktuell bleibt.
export default function SuspendControl({
  orgId,
  initialSuspended,
  initialReason,
  isSuperadmin,
  suspendAction,
  reactivateAction,
}: {
  orgId: string;
  initialSuspended: boolean;
  initialReason: string | null;
  isSuperadmin: boolean;
  suspendAction: (formData: FormData) => Promise<{ error?: string }>;
  reactivateAction: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const [suspended, setSuspended] = useState(initialSuspended);
  const [reason, setReason] = useState(initialReason);
  const [reasonInput, setReasonInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSuspend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await suspendAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuspended(true);
      setReason(reasonInput || null);
      router.refresh();
    });
  }

  function handleReactivate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await reactivateAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuspended(false);
      setReason(null);
      router.refresh();
    });
  }

  if (suspended) {
    return (
      <div className="card p-5 mb-6" style={{ borderColor: "rgba(239,68,68,0.35)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-[#FCA5A5] mb-1">Dieser Betrieb ist gesperrt</div>
            <div className="text-sm text-dim">{reason || "Kein Grund hinterlegt."}</div>
          </div>
          {isSuperadmin && (
            <form onSubmit={handleReactivate}>
              <input type="hidden" name="orgId" value={orgId} />
              <button type="submit" disabled={pending} className="btn btn-primary text-sm">
                {pending ? "Wird entsperrt…" : "Entsperren"}
              </button>
            </form>
          )}
        </div>
        {error && (
          <div className="mt-3 text-sm rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  if (!isSuperadmin) return null;

  return (
    <details className="card p-5 mb-6">
      <summary className="text-sm font-semibold cursor-pointer">Betrieb sperren</summary>
      <form onSubmit={handleSuspend} className="mt-4 space-y-3">
        <input type="hidden" name="orgId" value={orgId} />
        <div>
          <label className="label">Grund (wird dem Betrieb angezeigt)</label>
          <textarea
            name="reason"
            rows={2}
            className="input text-sm"
            placeholder="z. B. Verstoß gegen die AGB"
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
          />
        </div>
        <button type="submit" disabled={pending} className="btn btn-ghost text-sm">
          {pending ? "Wird gesperrt…" : "Betrieb sperren"}
        </button>
        {error && (
          <div className="mt-2 text-sm rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
            {error}
          </div>
        )}
      </form>
    </details>
  );
}
