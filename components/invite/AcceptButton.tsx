"use client";

import { useState, useTransition } from "react";
import { acceptInvitation } from "@/app/invite/[token]/actions";

export default function AcceptButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function accept() {
    setError(null);
    startTransition(async () => {
      const res = await acceptInvitation(token);
      if (res.error) {
        setError(res.error);
        return;
      }
      window.location.href = "/dashboard";
    });
  }

  return (
    <div>
      {error && (
        <div className="mb-5 text-sm rounded-lg px-3 py-2.5 bg-[rgba(239,68,68,0.12)] text-[#FCA5A5] border border-[rgba(239,68,68,0.2)]">
          {error}
        </div>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={accept}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[15px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-70 bg-gold-grad text-[#241a0c] shadow-[0_8px_26px_rgba(219,159,82,0.32)] hover:shadow-[0_12px_34px_rgba(219,159,82,0.45)] hover:-translate-y-px"
      >
        {pending ? "Wird angenommen…" : "Einladung annehmen"}
      </button>
    </div>
  );
}
