import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { getCurrentOrg } from "@/lib/org";
import { hasMinRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { issueCard, addStamp, addPoints, redeem, setProgramActive } from "../actions";
import { rewardIsCurrent } from "@/lib/konto";
import { resolveDesign, cardBaseStyle, cardTextColor } from "@/lib/card-design";
import DeleteProgramButton from "@/components/programs/DeleteProgramButton";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function ProgramDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; ok?: string };
}) {
  const { org, role } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");
  const canManage = hasMinRole(role, "admin");

  const supabase = createClient();
  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("id", params.id)
    .eq("org_id", org.id)
    .single();
  if (!program) notFound();

  const { data: cards } = await supabase
    .from("cards")
    .select("*, customers(full_name, email)")
    .eq("program_id", params.id)
    .order("created_at", { ascending: false });

  const { data: rewardRows } = await supabase
    .from("rewards")
    .select("id, title, cost_points, is_default, valid_from, valid_until")
    .eq("program_id", params.id)
    .eq("active", true)
    .is("ended_at", null)
    .order("cost_points", { ascending: true });
  const rewards = (rewardRows ?? []).filter((r: any) => rewardIsCurrent(r));

  const isStamp = program.type === "stamp";
  const design = resolveDesign(program.design);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const joinUrl = `${appUrl}/j/${program.id}`;
  const joinQr = await QRCode.toDataURL(joinUrl, { margin: 1, width: 140, color: { dark: "#111111", light: "#ffffff" } });

  return (
    <div>
      <Link href="/dashboard/programs" className="text-sm text-muted hover:text-gold-bright transition-colors">
        ← Programme
      </Link>

      {searchParams?.error && (
        <div role="alert" className="mt-3 text-sm font-medium rounded-xl px-4 py-3 bg-danger/10 text-danger">
          {searchParams.error}
        </div>
      )}
      {searchParams?.ok && (
        <div role="status" className="mt-3 text-sm font-medium rounded-xl px-4 py-3 bg-forest/10 text-forest">
          {searchParams.ok}
        </div>
      )}
      {!program.active && (
        <div className="mt-3 text-sm font-medium rounded-xl px-4 py-3 bg-warn/10 text-warn">
          Dieses Programm ist pausiert: keine Vergabe, keine Einlösung, kein öffentlicher Beitritt.
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mt-3 mb-6 enter flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl grid place-items-center font-extrabold shrink-0 overflow-hidden"
            style={{ ...cardBaseStyle(design), color: cardTextColor(design) }}
          >
            {design.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={design.logoImage} alt="" className="w-full h-full object-cover" />
            ) : (
              design.logo
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{program.title}</h1>
            <div className="text-sm text-muted">
              {isStamp
                ? `${program.stamps_required} Stempel → ${program.reward_description}`
                : `${program.points_per_reward} Punkte → ${program.reward_description}`}
            </div>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/programs/${program.id}/edit`} className="btn btn-ghost text-sm">
              Bearbeiten
            </Link>
            <form action={setProgramActive.bind(null, program.id, !program.active)}>
              <SubmitButton pendingText="…" className="btn btn-ghost text-sm">
                {program.active ? "Pausieren" : "Aktivieren"}
              </SubmitButton>
            </form>
            {(cards?.length ?? 0) === 0 && (
              <DeleteProgramButton programId={program.id} cardCount={0} redirectTo="/dashboard/programs" />
            )}
          </div>
        )}
      </div>

      {/* Selbstanmeldung per QR */}
      <div className="card p-5 mb-6 enter flex flex-wrap items-center gap-5" style={{ animationDelay: "30ms" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={joinQr} alt="QR-Code zur Selbstanmeldung" className="w-20 h-20 rounded-lg bg-white p-1.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm text-fg mb-1">Kunden melden sich selbst an</div>
          <div className="text-xs text-muted mb-2">
            QR-Code am Tresen aufstellen — Kunde scannt, trägt Namen ein, Karte ist fertig. Kein Personal-Aufwand nötig.
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/poster/${program.id}`} target="_blank" className="btn btn-primary text-sm">
              Aufsteller herunterladen
            </Link>
            <Link href={`/j/${program.id}`} target="_blank" className="btn btn-ghost text-sm">
              Seite öffnen ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Neue Karte ausgeben (manuell durch Personal) */}
      <form action={issueCard} className="card p-5 mb-8 enter" style={{ animationDelay: "60ms" }}>
        <div className="font-semibold text-sm text-fg mb-3">Karte an Kunden ausgeben</div>
        <input type="hidden" name="orgId" value={org.id} />
        <input type="hidden" name="programId" value={program.id} />
        <div className="grid gap-3 md:grid-cols-3">
          <input className="input" name="full_name" required placeholder="Name des Kunden" />
          <input className="input" name="email" type="email" placeholder="E-Mail (optional)" />
          <SubmitButton pendingText="Wird erstellt…">Karte erstellen</SubmitButton>
        </div>
      </form>

      {/* Ausgegebene Karten */}
      <div className="font-semibold text-sm text-fg mb-3">
        Karten ({cards?.length ?? 0})
      </div>
      <div className="space-y-3">
        {(cards ?? []).map((c: any, i: number) => {
          const ready = rewards.some((r: any) => r.cost_points <= (isStamp ? c.stamps : c.points));
          return (
            <div
              key={c.id}
              className="card card-hover p-4 flex flex-wrap items-center gap-4 justify-between enter"
              style={{ animationDelay: `${120 + i * 40}ms` }}
            >
              <div className="min-w-0">
                <div className="font-medium text-sm">{c.customers?.full_name ?? "Kunde"}</div>
                <div className="text-xs text-muted">
                  {isStamp
                    ? `${c.stamps} / ${program.stamps_required} Stempel`
                    : `${c.points} / ${program.points_per_reward} Punkte`}
                  {ready && <span className="ml-2 text-forest">· Belohnung frei</span>}
                </div>
                <Link href={`/c/${c.serial_number}`} target="_blank"
                      className="text-xs text-gold hover:text-gold-bright hover:underline">
                  Kundenkarte öffnen ↗
                </Link>
              </div>
              <div className="flex gap-2">
                {isStamp ? (
                  <form action={addStamp} className="flex gap-2">
                    <input type="hidden" name="requestId" value={randomUUID()} />
                    <input type="hidden" name="cardId" value={c.id} />
                    <input type="hidden" name="programId" value={program.id} />
                    {program.earning_mode === "amount" && (
                      <input
                        type="number"
                        name="amount"
                        step="0.01"
                        min="0"
                        required
                        placeholder={`ab ${Number(program.min_purchase_amount ?? 0).toFixed(2)} €`}
                        className="input text-sm w-32"
                        aria-label="Einkaufsbetrag in Euro"
                      />
                    )}
                    <SubmitButton pendingText="…" className="btn btn-primary text-sm">
                      + Stempel
                    </SubmitButton>
                  </form>
                ) : (
                  <form action={addPoints} className="flex gap-2">
                    <input type="hidden" name="requestId" value={randomUUID()} />
                    <input type="hidden" name="cardId" value={c.id} />
                    <input type="hidden" name="programId" value={program.id} />
                    {program.earning_mode === "amount" && (
                      <input
                        type="number"
                        name="amount"
                        step="0.01"
                        min="0"
                        required
                        placeholder={`€ / ${Number(program.amount_per_point ?? 0).toFixed(2)} = 1 Punkt`}
                        className="input text-sm w-40"
                        aria-label="Einkaufsbetrag in Euro"
                      />
                    )}
                    <SubmitButton pendingText="…" className="btn btn-primary text-sm">
                      {program.earning_mode === "amount" ? "+ Punkte" : "+ 10 Punkte"}
                    </SubmitButton>
                  </form>
                )}
                {(() => {
                  const balance = isStamp ? c.stamps : c.points;
                  const available = rewards.filter((r: any) => r.cost_points <= balance);
                  if (available.length === 0) {
                    return (
                      <span className="btn btn-ghost text-sm opacity-60 cursor-default" aria-disabled="true">
                        Keine Belohnung frei
                      </span>
                    );
                  }
                  return (
                    <form action={redeem} className="flex gap-2">
                      <input type="hidden" name="requestId" value={randomUUID()} />
                      <input type="hidden" name="cardId" value={c.id} />
                      <input type="hidden" name="programId" value={program.id} />
                      <label className="sr-only" htmlFor={`rw-${c.id}`}>Belohnung</label>
                      <select id={`rw-${c.id}`} name="rewardId" className="input text-sm w-44 !min-h-[36px] !py-1.5" defaultValue={available[available.length - 1].id}>
                        {available.map((r: any) => (
                          <option key={r.id} value={r.id}>
                            {r.title} ({r.cost_points})
                          </option>
                        ))}
                      </select>
                      <SubmitButton pendingText="…" className="btn btn-ghost text-sm">
                        Einlösen
                      </SubmitButton>
                    </form>
                  );
                })()}
              </div>
            </div>
          );
        })}
        {(!cards || cards.length === 0) && (
          <div className="text-faint text-sm">Noch keine Karten ausgegeben.</div>
        )}
      </div>
    </div>
  );
}
