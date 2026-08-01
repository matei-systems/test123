import Link from "next/link";
import { createOrg } from "./actions";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="max-w-md enter">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Betrieb anlegen</h1>
      <p className="text-[#A6A099] text-sm mb-6">
        Wie heißt dein Unternehmen? Das erscheint auf den Treuekarten deiner Kunden.
      </p>
      {searchParams?.error && (
        <div className="mb-4 text-sm rounded-lg px-3 py-2"
             style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
          {searchParams.error}
        </div>
      )}
      <form action={createOrg} className="card p-6 space-y-4">
        <div>
          <label className="label">Name des Betriebs</label>
          <input className="input" name="name" required placeholder="z. B. Café Central" />
        </div>
        <label className="flex items-start gap-2.5 text-sm text-dim cursor-pointer">
          <input
            type="checkbox"
            name="acceptAvv"
            required
            className="mt-0.5 w-4 h-4 rounded border-line bg-ink accent-gold shrink-0"
          />
          <span>
            Ich akzeptiere den{" "}
            <Link href="/avv" target="_blank" className="text-gold hover:text-gold-bright">
              Auftragsverarbeitungsvertrag (AVV)
            </Link>{" "}
            für die Verarbeitung der Daten meiner Kundschaft.
          </span>
        </label>
        <SubmitButton pendingText="Wird angelegt…" className="btn btn-primary w-full">
          Weiter
        </SubmitButton>
      </form>
    </div>
  );
}
