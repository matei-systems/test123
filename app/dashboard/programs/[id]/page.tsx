import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { getCurrentOrg } from "@/lib/org";
import { hasMinRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { issueCard, addStamp, addPoints, redeem } from "../actions";
import { resolveDesign, cardBaseStyle, cardTextColor } from "@/lib/card-design";
import DeleteProgramButton from "@/components/programs/DeleteProgramButton";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function ProgramDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
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

  const isStamp = program.type === "stamp";
  const design = resolveDesign(program.design);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const joinUrl = `${appUrl}/j/${program.id}`;
  const joinQr = await QRCode.toDataURL(joinUrl, { margin: 1, width: 140, color: { dark: "#111111", light: "#ffffff" } });

  return (
    <div>
      <Link href="/dashboard/programs" className="text-sm text-[#A6A099] hover:text-gold-bright transition-colors">
        ← Programme
      </Link>

      {searchParams?.error && (
        <div className="mt-3 text-sm rounded-lg px-3 py-2"
             style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
          {searchParams.error}
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
            <h1 className="text-xl font-bold tracking-tight">{program.title}</h1>
            <div className="text-sm text-[#A6A099]">
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
            <DeleteProgramButton programId={program.id} cardCount={cards?.length ?? 0} redirectTo="/dashboard/programs" />
          </div>
        )}
      </div>

      {/* Selbstanmeldung per QR */}
      <div className="card p-5 mb-6 enter flex flex-wrap items-center gap-5" style={{ animationDelay: "30ms" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={joinQr} alt="QR-Code zur Selbstanmeldung" className="w-20 h-20 rounded-lg bg-white p-1.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm text-[#F4F1EC] mb-1">Kunden melden sich selbst an</div>
          <div className="text-xs text-[#A6A099] mb-2">
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
        <div className="font-semibold text-sm text-[#F4F1EC] mb-3">Karte an Kunden ausgeben</div>
        <input type="hidden" name="orgId" value={org.id} />
        <input type="hidden" name="programId" value={program.id} />
        <div className="grid gap-3 md:grid-cols-3">
          <input className="input" name="full_name" required placeholder="Name des Kunden" />
          <input className="input" name="email" type="email" placeholder="E-Mail (optional)" />
          <SubmitButton pendingText="Wird erstellt…">Karte erstellen</SubmitButton>
        </div>
      </form>

      {/* Ausgegebene Karten */}
      <div className="font-semibold text-sm text-[#F4F1EC] mb-3">
        Karten ({cards?.length ?? 0})
      </div>
      <div className="space-y-3">
        {(cards ?? []).map((c: any, i: number) => {
          const ready = isStamp
            ? c.stamps >= program.stamps_required
            : c.points >= program.points_per_reward;
          return (
            <div
              key={c.id}
              className="card card-hover p-4 flex flex-wrap items-center gap-4 justify-between enter"
              style={{ animationDelay: `${120 + i * 40}ms` }}
            >
              <div className="min-w-0">
                <div className="font-medium text-sm">{c.customers?.full_name ?? "Kunde"}</div>
                <div className="text-xs text-[#A6A099]">
                  {isStamp
                    ? `${c.stamps} / ${program.stamps_required} Stempel`
                    : `${c.points} / ${program.points_per_reward} Punkte`}
                  {ready && <span className="ml-2 text-emerald-400">· Belohnung frei</span>}
                </div>
                <Link href={`/c/${c.serial_number}`} target="_blank"
                      className="text-xs text-gold hover:text-gold-bright hover:underline">
                  Kundenkarte öffnen ↗
                </Link>
              </div>
              <div className="flex gap-2">
                {isStamp ? (
                  <form action={addStamp}>
                    <input type="hidden" name="cardId" value={c.id} />
                    <input type="hidden" name="programId" value={program.id} />
                    <SubmitButton pendingText="…" className="btn btn-primary text-sm">
                      + Stempel
                    </SubmitButton>
                  </form>
                ) : (
                  <form action={addPoints}>
                    <input type="hidden" name="cardId" value={c.id} />
                    <input type="hidden" name="programId" value={program.id} />
                    <SubmitButton pendingText="…" className="btn btn-primary text-sm">
                      + 10 Punkte
                    </SubmitButton>
                  </form>
                )}
                <form action={redeem}>
                  <input type="hidden" name="cardId" value={c.id} />
                  <input type="hidden" name="programId" value={program.id} />
                  <SubmitButton pendingText="…" className="btn btn-ghost text-sm" disabled={!ready}>
                    Einlösen
                  </SubmitButton>
                </form>
              </div>
            </div>
          );
        })}
        {(!cards || cards.length === 0) && (
          <div className="text-[#6E685F] text-sm">Noch keine Karten ausgegeben.</div>
        )}
      </div>
    </div>
  );
}
