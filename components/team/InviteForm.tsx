"use client";

import { useState, useTransition } from "react";
import { inviteMember } from "@/app/dashboard/team/actions";
import type { Role } from "@/lib/permissions";

export default function InviteForm({ canInviteAdmin }: { canInviteAdmin: boolean }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ acceptUrl: string; emailed: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await inviteMember(email, role);
      if (res.error) {
        setError(res.error);
        return;
      }
      setResult({ acceptUrl: res.acceptUrl!, emailed: Boolean(res.emailed) });
      setEmail("");
      setRole("staff");
    });
  }

  return (
    <div>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
        <input
          className="input"
          type="email"
          required
          placeholder="mitarbeiter@beispiel.at"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select aria-label="Rolle" className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="staff">Mitarbeiter</option>
          {canInviteAdmin && <option value="admin">Admin</option>}
        </select>
        <button type="submit" disabled={pending} className="btn btn-primary text-sm">
          {pending ? "Wird eingeladen…" : "Einladen"}
        </button>
      </form>

      {error && (
        <div className="mt-3 text-sm rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 text-sm rounded-lg px-3 py-3 space-y-2" style={{ background: "rgba(16,185,129,0.1)", color: "#F4F1EC" }}>
          <div>
            {result.emailed
              ? "Einladung wurde per E-Mail verschickt. Alternativ kannst du den Link auch direkt teilen:"
              : "Einladung erstellt. Da noch kein E-Mail-Versand eingerichtet ist, teile diesen Link manuell (z. B. per WhatsApp oder E-Mail):"}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs bg-black/30 px-2 py-1 rounded break-all">{result.acceptUrl}</code>
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={() => {
                navigator.clipboard.writeText(result.acceptUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Kopiert ✓" : "Link kopieren"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
