"use client";

import { useState, useTransition } from "react";
import { deleteProgram } from "@/app/dashboard/programs/actions";

export default function DeleteProgramButton({
  programId,
  cardCount,
  redirectTo,
}: {
  programId: string;
  cardCount: number;
  redirectTo: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="btn btn-ghost text-sm">
        Löschen
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-danger">
        {cardCount > 0
          ? `${cardCount} ausgegebene Karte${cardCount === 1 ? "" : "n"} wird${cardCount === 1 ? "" : "en"} mit gelöscht. Sicher?`
          : "Wirklich löschen?"}
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await deleteProgram(programId);
            if (res.error) {
              setError(res.error);
              return;
            }
            // Full navigation, not router.push(): the client Router Cache
            // can hand router.push() a stale prefetched copy of the target
            // route (e.g. from the sidebar link being visible on this very
            // page) even after revalidatePath() ran server-side. A hard
            // navigation always refetches from the server.
            window.location.href = redirectTo;
          })
        }
        className="btn text-sm"
        style={{ background: "rgb(var(--danger) / 0.1)", color: "rgb(var(--danger))", border: "1px solid rgb(var(--danger) / 0.3)" }}
      >
        {pending ? "Wird gelöscht…" : "Ja, löschen"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="btn btn-ghost text-sm">
        Abbrechen
      </button>
      {error && <span className="text-xs text-danger w-full">{error}</span>}
    </div>
  );
}
