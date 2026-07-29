"use client";

import { useState, useTransition } from "react";
import { revokeInvitation } from "@/app/dashboard/team/actions";
import { ROLE_LABEL, type Role } from "@/lib/permissions";

interface Invitation {
  id: string;
  email: string;
  role: Role;
  created_at: string;
  expires_at: string;
  token: string;
}

export default function InvitationsList({ invitations }: { invitations: Invitation[] }) {
  const [items, setItems] = useState(invitations);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  function revoke(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const res = await revokeInvitation(id);
      setPendingId(null);
      if (!res.error) setItems((prev) => prev.filter((i) => i.id !== id));
    });
  }

  return (
    <div className="space-y-2">
      {items.map((inv) => {
        const expired = new Date(inv.expires_at) < new Date();
        const acceptUrl = `${appUrl}/invite/${inv.token}`;
        return (
          <div key={inv.id} className="card p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{inv.email}</div>
              <div className="text-xs text-[#A6A099]">
                {ROLE_LABEL[inv.role]} · {expired ? "Abgelaufen" : "Ausstehend"}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="btn btn-ghost text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(acceptUrl);
                  setCopiedId(inv.id);
                  setTimeout(() => setCopiedId(null), 1500);
                }}
              >
                {copiedId === inv.id ? "Kopiert ✓" : "Link kopieren"}
              </button>
              <button
                type="button"
                disabled={pendingId === inv.id}
                onClick={() => revoke(inv.id)}
                className="btn text-xs"
                style={{ background: "rgba(239,68,68,0.15)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                {pendingId === inv.id ? "…" : "Zurückziehen"}
              </button>
            </div>
          </div>
        );
      })}
      {items.length === 0 && <div className="text-[#6E685F] text-sm">Keine offenen Einladungen.</div>}
    </div>
  );
}
