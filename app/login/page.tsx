import { signIn, signUp } from "./actions";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg grid place-items-center font-extrabold text-white"
               style={{ background: "linear-gradient(140deg,#9D7BFF,#635BFF)" }}>M</div>
          <div>
            <div className="font-bold tracking-tight">Matei Loyalty</div>
            <div className="text-xs text-neutral-500">Digitale Treuekarten</div>
          </div>
        </div>

        {searchParams?.error && (
          <div className="mb-4 text-sm rounded-lg px-3 py-2"
               style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
            {searchParams.error}
          </div>
        )}

        {/* Ein Formular, zwei Actions (Anmelden / Registrieren) */}
        <form className="space-y-3">
          <div>
            <label className="label">E-Mail</label>
            <input className="input" type="email" name="email" required
                   defaultValue="" placeholder="du@beispiel.at" />
          </div>
          <div>
            <label className="label">Passwort</label>
            <input className="input" type="password" name="password" required
                   minLength={6} placeholder="mind. 6 Zeichen" />
          </div>
          <button className="btn btn-primary w-full" formAction={signIn}>
            Anmelden
          </button>
          <button className="btn btn-ghost w-full" formAction={signUp}>
            Neues Konto erstellen
          </button>
        </form>
      </div>
    </main>
  );
}
