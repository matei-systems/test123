import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWalletCards } from "@/lib/konto";
import WalletCardView from "@/components/konto/WalletCardView";
import { TextStamp } from "@/components/site/Illustrations";

export const metadata = { title: "Wallet" };

export default async function WalletPage({ searchParams }: { searchParams: { neu?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle();
  const { cards, error } = await getWalletCards(supabase, user!.id);
  const ready = cards.filter((c) => c.readyRewards.length > 0).length;
  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div className="enter">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{firstName ? `Hallo ${firstName}` : "Willkommen"}</p>
          <h1 className="mt-2 font-display text-[36px] font-semibold leading-tight sm:text-[44px]">Dein Wallet</h1>
          <p className="mt-1 text-[15px] text-muted">
            {cards.length === 0
              ? "Noch keine Karten – so geht’s los:"
              : `${cards.length} ${cards.length === 1 ? "Karte" : "Karten"} · getrennter Stand je Geschäft${ready ? ` · ${ready} mit Belohnung bereit` : ""}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/konto/scannen" className="btn btn-primary">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10" />
            </svg>
            QR-Code scannen
          </Link>
          <Link href="/konto/verknuepfen" className="btn btn-ghost">
            Karte verknüpfen
          </Link>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          Deine Karten konnten gerade nicht geladen werden. Bitte lade die Seite neu.
        </p>
      )}

      {cards.length > 0 ? (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <li key={c.id}>
              <Link href={`/konto/karten/${c.id}`} className="block h-full rounded-card" aria-label={`Karte ${c.business?.display_name ?? ""} öffnen`}>
                <WalletCardView card={c} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        !error && (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { title: "Im Geschäft scannen", body: "Scanne den QR-Code am Tresen eines teilnehmenden Geschäfts.", href: "/konto/scannen", cta: "Scanner öffnen" },
              { title: "Geschäft entdecken", body: "Finde Geschäfte im Verzeichnis und hol dir dort eine Karte.", href: "/geschaefte", cta: "Zum Verzeichnis" },
              { title: "Karte verknüpfen", body: "Du hast schon eine Karte per Link? Verknüpfe sie mit deinem Konto.", href: "/konto/verknuepfen", cta: "Verknüpfen" },
            ].map((s, i) => (
              <div key={s.title} className="card flex flex-col gap-3 p-6">
                <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-dashed border-stamp/70 font-display text-lg font-semibold text-accent">{i + 1}</span>
                <h2 className="font-display text-xl font-semibold">{s.title}</h2>
                <p className="text-[15px] text-muted">{s.body}</p>
                <Link href={s.href} className="btn btn-ghost btn-sm mt-auto w-fit">
                  {s.cta}
                </Link>
              </div>
            ))}
            <div className="card-flat flex items-center gap-5 p-6 md:col-span-3">
              <TextStamp size={84} spin={false} className="shrink-0" />
              <p className="text-[15px] leading-relaxed text-muted">
                Stempel und Punkte bleiben immer beim jeweiligen Geschäft. Jede Buchung erscheint in deinem Verlauf, und Belohnungen löst
                du mit einem Einmal-Code direkt an der Kasse ein.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
