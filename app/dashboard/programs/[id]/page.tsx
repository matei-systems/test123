import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { issueCard, addStamp, addPoints, redeem } from "../actions";
import { themeGradient } from "@/lib/themes";

export const dynamic = "force-dynamic";

export default async function ProgramDetail({ params }: { params: { id: string } }) {
  const { org } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  const supabase = createClient();
  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!program) notFound();

  const { data: cards } = await supabase
    .from("cards")
    .select("*, customers(full_name, email)")
    .eq("program_id", params.id)
    .order("created_at", { ascending: false });

  const isStamp = program.type === "stamp";

  return (
    <div>
      <Link href="/dashboard/programs" className="text-sm text-neutral-400 hover:text-white">
        ← Programme
      </Link>

      <div className="flex items-center gap-3 mt-3 mb-6">
        <div className="w-11 h-11 rounded-xl grid place-items-center font-extrabold text-white"
             style={{ background: themeGradient(program.design?.theme ?? 0) }}>
          {program.design?.logo ?? "C"}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{program.title}</h1>
          <div className="text-sm text-neutral-400">
            {isStamp
              ? `${program.stamps_required} Stempel → ${program.reward_description}`
              : `${program.points_per_reward} Punkte → ${program.reward_description}`}
          </div>
        </div>
      </div>

      {/* Neue Karte ausgeben */}
      <form action={issueCard} className="card p-5 mb-8">
        <div className="font-semibold text-sm text-neutral-300 mb-3">Karte an Kunden ausgeben</div>
        <input type="hidden" name="orgId" value={org.id} />
        <input type="hidden" name="programId" value={program.id} />
        <div className="grid gap-3 md:grid-cols-3">
          <input className="input" name="full_name" required placeholder="Name des Kunden" />
          <input className="input" name="email" type="email" placeholder="E-Mail (optional)" />
          <button className="btn btn-primary">Karte erstellen</button>
        </div>
      </form>

      {/* Ausgegebene Karten */}
      <div className="font-semibold text-sm text-neutral-300 mb-3">
        Karten ({cards?.length ?? 0})
      </div>
      <div className="space-y-3">
        {(cards ?? []).map((c: any) => {
          const ready = isStamp
            ? c.stamps >= program.stamps_required
            : c.points >= program.points_per_reward;
          return (
            <div key={c.id} className="card p-4 flex flex-wrap items-center gap-4 justify-between">
              <div>
                <div className="font-medium text-sm">{c.customers?.full_name ?? "Kunde"}</div>
                <div className="text-xs text-neutral-400">
                  {isStamp
                    ? `${c.stamps} / ${program.stamps_required} Stempel`
                    : `${c.points} / ${program.points_per_reward} Punkte`}
                  {ready && <span className="ml-2 text-emerald-400">· Belohnung frei</span>}
                </div>
                <Link href={`/c/${c.serial_number}`} target="_blank"
                      className="text-xs text-[#9D7BFF] hover:underline">
                  Kundenkarte öffnen ↗
                </Link>
              </div>
              <div className="flex gap-2">
                {isStamp ? (
                  <form action={addStamp}>
                    <input type="hidden" name="cardId" value={c.id} />
                    <input type="hidden" name="programId" value={program.id} />
                    <button className="btn btn-primary text-sm">+ Stempel</button>
                  </form>
                ) : (
                  <form action={addPoints}>
                    <input type="hidden" name="cardId" value={c.id} />
                    <input type="hidden" name="programId" value={program.id} />
                    <button className="btn btn-primary text-sm">+ 10 Punkte</button>
                  </form>
                )}
                <form action={redeem}>
                  <input type="hidden" name="cardId" value={c.id} />
                  <input type="hidden" name="programId" value={program.id} />
                  <button className="btn btn-ghost text-sm" disabled={!ready}>
                    Einlösen
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {(!cards || cards.length === 0) && (
          <div className="text-neutral-500 text-sm">Noch keine Karten ausgegeben.</div>
        )}
      </div>
    </div>
  );
}
