import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { hasMinRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/SubmitButton";
import { costText, fmtDate, programTypeLabel } from "@/lib/programs";
import { isoToViennaInput } from "@/lib/vienna-time";
import { createReward, deleteReward, endReward, setRewardActive, updateReward } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Belohnungen" };

function statusOf(r: any, program: any) {
  const now = Date.now();
  if (r.ended_at) return { label: "Beendet", badge: "badge-muted" };
  if (!r.active) return { label: "Pausiert", badge: "badge-warn" };
  if (r.valid_until && new Date(r.valid_until).getTime() < now) return { label: "Abgelaufen", badge: "badge-muted" };
  if (r.valid_from && new Date(r.valid_from).getTime() > now) return { label: `Ab ${fmtDate(r.valid_from)}`, badge: "badge-info" };
  if (program.type === "stamp" && r.cost_points > program.stamps_required) return { label: "Nicht erreichbar", badge: "badge-danger" };
  return { label: "Aktiv", badge: "badge-forest" };
}

function RewardFields({ r, program, isDefault }: { r?: any; program: any; isDefault?: boolean }) {
  const p = r?.id ?? `new-${program.id}`;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor={`t-${p}`} className="label">Name der Belohnung</label>
        <input id={`t-${p}`} name="title" className="input" defaultValue={r?.title ?? ""} required minLength={2} maxLength={80} disabled={isDefault} placeholder="z. B. Gratis Croissant" />
      </div>
      <div>
        <label htmlFor={`c-${p}`} className="label">Kosten ({program.type === "stamp" ? "Stempel" : "Punkte"})</label>
        <input
          id={`c-${p}`}
          name="cost_points"
          type="number"
          min={1}
          max={program.type === "stamp" ? program.stamps_required : 100000}
          className="input"
          defaultValue={r?.cost_points ?? ""}
          required
          disabled={isDefault}
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`d-${p}`} className="label">Beschreibung (optional)</label>
        <input id={`d-${p}`} name="description" className="input" defaultValue={r?.description ?? ""} maxLength={300} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`k-${p}`} className="label">Bedingungen (optional, für Kunden sichtbar)</label>
        <input id={`k-${p}`} name="conditions" className="input" defaultValue={r?.conditions ?? ""} maxLength={300} placeholder="z. B. Nur Mo–Fr, nicht mit anderen Aktionen kombinierbar" />
      </div>
      <div>
        <label htmlFor={`f-${p}`} className="label">Gültig ab (optional)</label>
        <input id={`f-${p}`} name="valid_from" type="date" className="input" defaultValue={isoToViennaInput(r?.valid_from)} />
      </div>
      <div>
        <label htmlFor={`u-${p}`} className="label">Gültig bis (optional)</label>
        <input id={`u-${p}`} name="valid_until" type="date" className="input" defaultValue={isoToViennaInput(r?.valid_until)} />
      </div>
      {isDefault && (
        <p className="hint sm:col-span-2">
          Name und Kosten der Standard-Belohnung kommen aus den <Link href={`/dashboard/programs/${program.id}/edit`} className="font-semibold text-accent">Programmeinstellungen</Link>.
        </p>
      )}
    </div>
  );
}

export default async function BelohnungenPage({ searchParams }: { searchParams: { ok?: string; fehler?: string } }) {
  const { org, role } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");
  const canManage = hasMinRole(role, "admin");

  const supabase = createClient();
  const [{ data: programs }, { data: rewards }, { data: redeemed }] = await Promise.all([
    supabase.from("loyalty_programs").select("id, name, title, type, stamps_required, points_per_reward, active").eq("org_id", org.id).order("created_at"),
    supabase.from("rewards").select("*").eq("org_id", org.id).order("is_default", { ascending: false }).order("cost_points"),
    supabase.from("reward_redemptions").select("reward_id").eq("org_id", org.id).not("reward_id", "is", null),
  ]);
  const used = new Map<string, number>();
  for (const r of redeemed ?? []) used.set((r as any).reward_id, (used.get((r as any).reward_id) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[30px] font-semibold leading-tight">Belohnungen</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Lege pro Programm fest, was sich Kundinnen und Kunden holen können. Pausierte, beendete oder abgelaufene Belohnungen können
          nicht eingelöst werden – das prüft der Server bei jeder Einlösung.
        </p>
      </div>
      {searchParams.ok && <p role="status" className="rounded-xl bg-forest/10 px-4 py-3 text-sm font-medium text-forest">{searchParams.ok}</p>}
      {searchParams.fehler && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{searchParams.fehler}</p>}

      {(programs ?? []).length === 0 && (
        <div className="card p-8 text-center">
          <h2 className="font-display text-2xl font-semibold">Noch kein Programm</h2>
          <p className="mt-2 text-muted">Belohnungen gehören zu einem Treueprogramm. Lege zuerst ein Programm an.</p>
          <Link href="/dashboard/programs/new" className="btn btn-primary mt-5">Programm anlegen</Link>
        </div>
      )}

      {(programs ?? []).map((program: any) => {
        const list = (rewards ?? []).filter((r: any) => r.program_id === program.id);
        return (
          <section key={program.id} className="card p-6" aria-labelledby={`p-${program.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className={`badge ${program.type === "stamp" ? "badge-forest" : "badge-accent"}`}>{programTypeLabel(program.type)}</span>
                <h2 id={`p-${program.id}`} className="mt-2 font-display text-xl font-semibold">{program.title || program.name}</h2>
              </div>
              {!program.active && <span className="badge badge-warn">Programm pausiert</span>}
            </div>

            <ul className="mt-5 space-y-3">
              {list.map((r: any) => {
                const st = statusOf(r, program);
                const count = used.get(r.id) ?? 0;
                return (
                  <li key={r.id} className="rounded-2xl border border-line p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{r.title}</span>
                          <span className={`badge ${st.badge}`}>{st.label}</span>
                          {r.is_default && <span className="badge badge-muted">Standard</span>}
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          {costText(program.type, r.cost_points)}
                          {count > 0 ? ` · ${count}× eingelöst` : ""}
                          {r.valid_until ? ` · bis ${fmtDate(r.valid_until)}` : ""}
                        </p>
                        {r.conditions && <p className="mt-1 text-sm text-faint">Bedingung: {r.conditions}</p>}
                      </div>
                      {canManage && !r.ended_at && (
                        <div className="flex flex-wrap gap-2">
                          <form action={setRewardActive.bind(null, r.id, !r.active)}>
                            <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">{r.active ? "Pausieren" : "Aktivieren"}</SubmitButton>
                          </form>
                          {!r.is_default && (
                            <form action={count > 0 ? endReward.bind(null, r.id) : deleteReward.bind(null, r.id)}>
                              <SubmitButton className="btn btn-danger btn-sm" pendingText="…">{count > 0 ? "Beenden" : "Löschen"}</SubmitButton>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                    {canManage && !r.ended_at && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-semibold text-accent">Bearbeiten</summary>
                        <form action={updateReward} className="mt-3 space-y-3">
                          <input type="hidden" name="id" value={r.id} />
                          <RewardFields r={r} program={program} isDefault={r.is_default} />
                          <SubmitButton className="btn btn-dark btn-sm" pendingText="Speichern …">Speichern</SubmitButton>
                        </form>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>

            {canManage && (
              <details className="mt-5 rounded-2xl border border-dashed border-line-2 p-4">
                <summary className="cursor-pointer font-semibold text-accent">+ Neue Belohnung für dieses Programm</summary>
                <form action={createReward} className="mt-4 space-y-3">
                  <input type="hidden" name="program_id" value={program.id} />
                  <RewardFields program={program} />
                  <SubmitButton className="btn btn-primary btn-sm" pendingText="Wird angelegt …">Belohnung anlegen</SubmitButton>
                </form>
              </details>
            )}
          </section>
        );
      })}
      {!canManage && (programs ?? []).length > 0 && <p className="text-sm text-faint">Belohnungen können nur Inhaber und Admins ändern.</p>}
    </div>
  );
}
