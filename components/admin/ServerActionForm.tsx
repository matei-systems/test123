"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";

// Wrapper für Admin-Aktionen, die eine bereits angezeigte Seite mutieren
// (Betrieb sperren/entsperren/Testphase verlängern) - ruft die Server
// Action direkt auf (statt sie als form-"action" zu verwenden) und erzwingt
// danach ein echtes router.refresh(), statt sich auf Next.js' automatisches
// Neu-Rendern nach einer Server Action zu verlassen (siehe Kommentar in
// app/admin/organizations/actions.ts).
export default function ServerActionForm({
  action,
  children,
  className,
  submitLabel,
  pendingLabel,
  submitClassName = "btn btn-primary text-sm",
}: {
  action: (formData: FormData) => Promise<{ error?: string }>;
  children?: React.ReactNode;
  className?: string;
  submitLabel: string;
  pendingLabel: string;
  submitClassName?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
      <button type="submit" disabled={pending} className={submitClassName}>
        {pending ? pendingLabel : submitLabel}
      </button>
      {error && (
        <div className="mt-2 text-sm rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
          {error}
        </div>
      )}
    </form>
  );
}
