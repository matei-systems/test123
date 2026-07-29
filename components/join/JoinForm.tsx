"use client";

import { useState, useTransition } from "react";
import { joinProgram } from "@/app/j/[programId]/actions";
import { Field, ErrorMessage } from "@/components/auth/FormMessage";

export default function JoinForm({ programId }: { programId: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await joinProgram(programId, { fullName, email, honeypot });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.serial) {
        window.location.href = `/c/${res.serial}`;
      }
    });
  }

  return (
    <form onSubmit={submit} className="bg-auth-surface border border-line rounded-2xl p-6">
      <ErrorMessage>{error}</ErrorMessage>
      <Field
        label="Dein Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        autoFocus
        placeholder="Vorname Nachname"
      />
      <Field
        label="E-Mail (optional)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="du@beispiel.at"
      />
      {/* Honeypot - für Menschen unsichtbar, Bots füllen es oft aus */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute opacity-0 pointer-events-none -z-10 w-0 h-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[15px] font-semibold bg-gold-grad text-[#241a0c] shadow-[0_8px_26px_rgba(219,159,82,0.32)] hover:shadow-[0_12px_34px_rgba(219,159,82,0.45)] hover:-translate-y-px transition-all disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Wird erstellt…" : "Meine Treuekarte erstellen"}
      </button>
    </form>
  );
}
