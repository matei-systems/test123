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
    <form onSubmit={submit} className="card p-6">
      <h2 className="font-display text-xl font-semibold mb-1">Ohne Konto</h2>
      <p className="text-sm text-muted mb-5">Die Karte öffnet sich über ihren Link. Speichere ihn dir oder verknüpfe sie später mit einem Konto.</p>
      <ErrorMessage>{error}</ErrorMessage>
      <Field
        label="Dein Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        name="fullName"
        required
        autoComplete="name"
        placeholder="Vorname Nachname"
      />
      <Field
        label="E-Mail (optional)"
        type="email"
        name="email"
        autoComplete="email"
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
        className="btn btn-dark btn-lg w-full"
      >
        {pending ? "Wird erstellt…" : "Karte ohne Konto erstellen"}
      </button>
    </form>
  );
}
