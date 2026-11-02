import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { claimCardAction } from "@/app/konto/actions";

export const metadata = { title: "Karte verknüpfen" };

export default function VerknuepfenPage({ searchParams }: { searchParams: { fehler?: string } }) {
  return (
    <div className="enter mx-auto max-w-xl">
      <Link href="/konto" className="text-sm text-muted hover:text-accent">
        ← Wallet
      </Link>
      <h1 className="mt-4 font-display text-[34px] font-semibold leading-tight">Karte verknüpfen</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Du hast eine Karte ohne Konto erstellt oder vom Geschäft einen Link bekommen? Füge den Link ein – die Karte erscheint dann in
        deinem Wallet, dein bisheriger Stand bleibt erhalten.
      </p>
      <form action={claimCardAction} className="card mt-6 space-y-4 p-6">
        {searchParams.fehler && (
          <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
            {searchParams.fehler}
          </p>
        )}
        <div>
          <label htmlFor="card" className="label">Link oder Kartennummer</label>
          <input id="card" name="card" className="input" placeholder="https://matei.systems/c/…" required autoComplete="off" />
          <p className="hint">Den Link findest du in der Adresszeile, wenn du deine Karte öffnest.</p>
        </div>
        <SubmitButton pendingText="Wird verknüpft …">Karte verknüpfen</SubmitButton>
      </form>
      <p className="mt-6 text-sm text-faint">
        Einfacher: Öffne die Karte über ihren Link, während du angemeldet bist, und tippe dort auf „Mit meinem Konto verknüpfen“. Eine
        Karte kann nur mit einem Konto verknüpft sein.
      </p>
    </div>
  );
}
