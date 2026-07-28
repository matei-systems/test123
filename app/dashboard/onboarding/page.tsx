import { createOrg } from "./actions";

export const dynamic = "force-dynamic";

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Betrieb anlegen</h1>
      <p className="text-neutral-400 text-sm mb-6">
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
        <button className="btn btn-primary w-full">Weiter</button>
      </form>
    </div>
  );
}
