import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { describeEntry, getAllHistory, getWalletCards } from "@/lib/konto";
import { fmtDateTime } from "@/lib/programs";

export const metadata = { title: "Verlauf" };

export default async function VerlaufPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { cards } = await getWalletCards(supabase, user!.id);
  const history = await getAllHistory(
    supabase,
    cards.map((c) => c.id),
    150
  );
  const byCard = new Map(cards.map((c) => [c.id, c]));

  // Nach Tagen gruppieren
  const groups = new Map<string, typeof history>();
  for (const e of history) {
    const day = new Intl.DateTimeFormat("de-AT", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(e.created_at));
    groups.set(day, [...(groups.get(day) ?? []), e]);
  }

  return (
    <div className="enter">
      <p className="eyebrow">Alle Buchungen</p>
      <h1 className="mt-2 font-display text-[36px] font-semibold leading-tight sm:text-[44px]">Verlauf</h1>
      <p className="mt-1 text-[15px] text-muted">Jeder Stempel, jeder Punkt und jede Einlösung – über alle deine Karten.</p>

      {history.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <h2 className="font-display text-2xl font-semibold">Noch keine Buchungen</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">Sobald ein Geschäft deine Karte scannt, siehst du die Buchung hier – mit Datum und Geschäft.</p>
          <Link href="/konto" className="btn btn-ghost mt-6">
            Zum Wallet
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {Array.from(groups.entries()).map(([day, entries]) => (
            <section key={day} aria-label={day}>
              <h2 className="text-sm font-semibold text-muted">{day}</h2>
              <ul className="card mt-2 divide-y divide-line">
                {entries.map((e) => {
                  const card = byCard.get(e.card_id);
                  const d = describeEntry(e, card?.program?.type ?? "stamp");
                  return (
                    <li key={e.id}>
                      <Link href={`/konto/karten/${e.card_id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-fg/[0.02]">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{card?.business?.display_name ?? "Geschäft"}</div>
                          <div className="truncate text-sm text-muted">
                            {d.label} · {fmtDateTime(e.created_at).split(", ")[1]}
                          </div>
                        </div>
                        {d.delta && (
                          <span className={`shrink-0 font-semibold tabular ${d.tone === "forest" ? "text-forest" : d.tone === "accent" ? "text-accent" : "text-muted"}`}>{d.delta}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {history.length >= 150 && <p className="text-sm text-faint">Es werden die letzten 150 Buchungen angezeigt. Ältere findest du in der jeweiligen Karte oder im Datenexport.</p>}
        </div>
      )}
    </div>
  );
}
