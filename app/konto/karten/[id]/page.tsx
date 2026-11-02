import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { describeEntry, getCardHistory, getWalletCard } from "@/lib/konto";
import { CardHeader, ProgressBar, StampGrid, balanceLine, nextLine } from "@/components/konto/WalletCardView";
import { costText, earningRuleText, fmtDate, fmtDateTime } from "@/lib/programs";
import SubmitButton from "@/components/SubmitButton";
import { requestRedemptionCode } from "@/app/konto/actions";

export const metadata = { title: "Karte" };

export default async function KartePage({ params, searchParams }: { params: { id: string }; searchParams: { fehler?: string; neu?: string; verknuepft?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const card = await getWalletCard(supabase, user!.id, params.id);
  if (!card) notFound();

  const p = card.program;
  const [history, pending] = await Promise.all([
    getCardHistory(supabase, card.id, 30),
    supabase
      .from("redemption_requests")
      .select("id, expires_at")
      .eq("card_id", card.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://matei.systems";
  const qrSvg = await QRCode.toString(`${appUrl}/c/${card.serial_number}`, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#14110F", light: "#FFFFFF" },
  });
  const canRedeem = card.status !== "inactive" && p?.active;
  const goal = card.nextReward?.cost_points ?? (p?.type === "stamp" ? p.stamps_required : p?.points_per_reward ?? 1);

  return (
    <div className="enter">
      <Link href="/konto" className="text-sm text-muted hover:text-accent">
        ← Wallet
      </Link>

      {searchParams.neu === "1" && (
        <p role="status" className="mt-4 rounded-xl bg-forest/10 px-4 py-3 text-sm font-semibold text-forest">
          Deine Karte ist angelegt. Zeig den QR-Code beim nächsten Einkauf an der Kasse.
        </p>
      )}
      {searchParams.verknuepft === "1" && (
        <p role="status" className="mt-4 rounded-xl bg-forest/10 px-4 py-3 text-sm font-semibold text-forest">
          Die Karte ist jetzt mit deinem Konto verknüpft. Dein bisheriger Stand bleibt erhalten.
        </p>
      )}
      {searchParams.fehler && (
        <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          {searchParams.fehler}
        </p>
      )}
      {pending.data && (
        <Link href={`/konto/einloesen/${pending.data.id}`} className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-accent-strong/10 px-4 py-3 text-sm font-semibold text-accent">
          Du hast einen offenen Einlöse-Code (gültig bis {fmtDateTime(pending.data.expires_at).split(", ")[1] ?? ""}).
          <span aria-hidden="true">Anzeigen →</span>
        </Link>
      )}

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <section className="card overflow-hidden" aria-label="Kartenstand">
            <CardHeader card={card} large />
            <div className="space-y-4 p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h1 className="font-display text-[30px] font-semibold leading-none tabular">{balanceLine(card)}</h1>
                {card.activeMultiplier > 1 && <span className="badge badge-accent">Aktion ×{card.activeMultiplier} aktiv</span>}
              </div>
              {p?.type === "stamp" ? (
                <StampGrid filled={Math.min(card.stamps, p.stamps_required)} total={p.stamps_required} />
              ) : (
                <ProgressBar value={card.balance} max={goal} tone={card.readyRewards.length ? "forest" : "stamp"} />
              )}
              <p className={`text-[15px] ${card.readyRewards.length ? "font-semibold text-forest" : "text-muted"}`}>{nextLine(card)}</p>
              {p && <p className="text-sm text-faint">So sammelst du: {earningRuleText(p)}</p>}
              {!p?.active && <p className="text-sm font-semibold text-warn">Dieses Programm ist gerade pausiert – Sammeln und Einlösen sind vorübergehend nicht möglich.</p>}
              {card.status === "inactive" && <p className="text-sm font-semibold text-danger">Diese Karte wurde vom Geschäft deaktiviert.</p>}
            </div>
          </section>

          <section className="card p-6" aria-labelledby="qr-h">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <div className="w-44 shrink-0 rounded-2xl border border-line bg-white p-2" dangerouslySetInnerHTML={{ __html: qrSvg }} aria-label="QR-Code deiner Karte" role="img" />
              <div>
                <h2 id="qr-h" className="font-display text-xl font-semibold">An der Kasse vorzeigen</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  Das Geschäft scannt diesen Code und bucht Stempel oder Punkte auf deine Karte. Er gehört nur zu dieser Karte – bitte nicht
                  öffentlich teilen.
                </p>
                <Link href={`/c/${card.serial_number}`} className="btn btn-ghost btn-sm mt-4">
                  Karte im Vollbild öffnen
                </Link>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6" aria-labelledby="rewards-h">
            <h2 id="rewards-h" className="font-display text-xl font-semibold">Belohnungen</h2>
            {card.rewards.length === 0 ? (
              <p className="mt-3 text-[15px] text-muted">Für dieses Programm sind gerade keine Belohnungen aktiv.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {card.rewards.map((r) => {
                  const available = r.cost_points <= card.balance;
                  const missing = r.cost_points - card.balance;
                  return (
                    <li key={r.id} className={`ticket flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${available ? "" : "opacity-95"}`}>
                      <div className="flex flex-1 items-start gap-4">
                        <div className="w-16 shrink-0 text-center">
                          <span className="block font-display text-2xl font-semibold leading-none text-accent tabular">{r.cost_points}</span>
                          <span className="text-xs text-muted">{p?.type === "stamp" ? "Stempel" : "Punkte"}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold">{r.title}</div>
                          {r.description && <p className="text-sm text-muted">{r.description}</p>}
                          {r.conditions && <p className="mt-0.5 text-sm text-faint">Bedingung: {r.conditions}</p>}
                          {r.valid_until && <p className="mt-0.5 text-sm text-faint">Gültig bis {fmtDate(r.valid_until)}</p>}
                        </div>
                      </div>
                      {available && canRedeem ? (
                        <form action={requestRedemptionCode.bind(null, card.id, r.id)} className="sm:shrink-0">
                          <SubmitButton className="btn btn-forest btn-sm w-full sm:w-auto" pendingText="Code wird erstellt …">
                            Einlöse-Code anzeigen
                          </SubmitButton>
                        </form>
                      ) : (
                        <span className="badge badge-muted w-fit sm:shrink-0">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
                            <rect x="5" y="11" width="14" height="10" rx="2" />
                            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                          </svg>
                          {available ? "Derzeit nicht einlösbar" : `Noch ${p ? costText(p.type, missing) : missing}`}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-4 text-sm text-faint">
              Der Einlöse-Code gilt 10 Minuten und nur einmal. Das Guthaben wird erst abgezogen, wenn das Geschäft den Code einlöst.
            </p>
          </section>

          <section className="card p-6" aria-labelledby="history-h">
            <div className="flex items-center justify-between gap-3">
              <h2 id="history-h" className="font-display text-xl font-semibold">Verlauf</h2>
              {history.length >= 30 && (
                <Link href="/konto/verlauf" className="text-sm font-semibold text-accent">
                  Alles ansehen
                </Link>
              )}
            </div>
            {history.length === 0 ? (
              <p className="mt-3 text-[15px] text-muted">Noch keine Buchungen. Dein erster Stempel erscheint hier, sobald das Geschäft scannt.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {history.map((e) => {
                  const d = describeEntry(e, p?.type ?? "stamp");
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-medium">{d.label}</div>
                        <div className="text-sm text-faint">{fmtDateTime(e.created_at)}</div>
                      </div>
                      {d.delta && (
                        <span className={`shrink-0 font-semibold tabular ${d.tone === "forest" ? "text-forest" : d.tone === "accent" ? "text-accent" : "text-muted"}`}>{d.delta}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {card.business?.listing_status === "approved" && card.business.is_listed && (
            <Link href={`/geschaefte/${card.business.slug}`} className="btn btn-ghost w-full">
              Profil von {card.business.display_name} ansehen
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
