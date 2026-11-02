import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { hasMinRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/SubmitButton";
import { fmtDateTime, multiplierFactor } from "@/lib/programs";
import { createCampaign, deleteCampaign, endCampaign, setCampaignActive } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aktionen" };

function statusOf(c: any) {
  const now = Date.now();
  if (c.ends_at && new Date(c.ends_at).getTime() <= now) return { label: "Beendet", badge: "badge-muted", running: false, ended: true };
  if (!c.active) return { label: "Pausiert", badge: "badge-warn", running: false, ended: false };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: "Geplant", badge: "badge-info", running: false, ended: false };
  return { label: "Läuft", badge: "badge-forest", running: true, ended: false };
}

export default async function AktionenPage({ searchParams }: { searchParams: { ok?: string; fehler?: string } }) {
  const { org, role } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");
  const canManage = hasMinRole(role, "admin");
  const supabase = createClient();
  const [{ data: campaigns }, { data: programs }, { data: txs }] = await Promise.all([
    supabase.from("campaigns").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
    supabase.from("loyalty_programs").select("id, name, title").eq("org_id", org.id).order("created_at"),
    supabase.from("transactions").select("campaign_id").eq("org_id", org.id).not("campaign_id", "is", null),
  ]);
  const usage = new Map<string, number>();
  for (const t of txs ?? []) usage.set((t as any).campaign_id, (usage.get((t as any).campaign_id) ?? 0) + 1);
  const programName = (id: string | null) => (id ? (programs ?? []).find((p: any) => p.id === id)?.title ?? "Programm" : "Alle Programme");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[30px] font-semibold leading-tight">Aktionen</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Mit einer Multiplikator-Aktion zählt jede Buchung im Aktionszeitraum doppelt bis fünffach – automatisch, beim nächsten Scan.
          Hinweis-Aktionen erscheinen in deinem Profil und im Wallet deiner Kundschaft.
        </p>
      </div>
      {searchParams.ok && <p role="status" className="rounded-xl bg-forest/10 px-4 py-3 text-sm font-medium text-forest">{searchParams.ok}</p>}
      {searchParams.fehler && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{searchParams.fehler}</p>}

      {canManage && (
        <details className="card p-6" open={(campaigns ?? []).length === 0}>
          <summary className="cursor-pointer font-display text-xl font-semibold">+ Neue Aktion</summary>
          <form action={createCampaign} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="label">Name</label>
              <input id="name" name="name" className="input" required minLength={2} maxLength={80} placeholder="z. B. Doppelte Stempel im November" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description" className="label">Beschreibung (optional, für Kunden sichtbar)</label>
              <input id="description" name="description" className="input" maxLength={300} />
            </div>
            <div>
              <label htmlFor="type" className="label">Art</label>
              <select id="type" name="type" className="input" defaultValue="multiplier">
                <option value="multiplier">Multiplikator (mehr Stempel/Punkte)</option>
                <option value="announcement">Nur Hinweis</option>
              </select>
            </div>
            <div>
              <label htmlFor="factor" className="label">Faktor (nur Multiplikator)</label>
              <select id="factor" name="factor" className="input" defaultValue="2">
                {[2, 3, 4, 5].map((f) => (
                  <option key={f} value={f}>
                    ×{f}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="program_id" className="label">Gilt für</label>
              <select id="program_id" name="program_id" className="input" defaultValue="">
                <option value="">Alle Programme</option>
                {(programs ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="starts_at" className="label">Start (leer = sofort)</label>
              <input id="starts_at" name="starts_at" type="datetime-local" className="input" />
            </div>
            <div>
              <label htmlFor="ends_at" className="label">Ende</label>
              <input id="ends_at" name="ends_at" type="datetime-local" className="input" />
              <p className="hint">Pflicht bei Multiplikator-Aktionen, höchstens 3 Monate.</p>
            </div>
            <div className="sm:col-span-2">
              <SubmitButton className="btn btn-primary" pendingText="Wird angelegt …">Aktion anlegen</SubmitButton>
            </div>
          </form>
        </details>
      )}

      <section aria-label="Alle Aktionen" className="space-y-3">
        {(campaigns ?? []).length === 0 ? (
          <div className="card p-6 text-center text-muted">Noch keine Aktionen angelegt.</div>
        ) : (
          (campaigns ?? []).map((c: any) => {
            const st = statusOf(c);
            const n = usage.get(c.id) ?? 0;
            return (
              <article key={c.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{c.name}</h2>
                    <span className={`badge ${st.badge}`}>{st.label}</span>
                    <span className="badge badge-accent">{c.type === "multiplier" ? `×${multiplierFactor(c.config)}` : "Hinweis"}</span>
                  </div>
                  {c.description && <p className="mt-1 text-sm text-muted">{c.description}</p>}
                  <p className="mt-1 text-sm text-faint">
                    {programName(c.program_id)} · {c.starts_at ? `ab ${fmtDateTime(c.starts_at)}` : "sofort"}
                    {c.ends_at ? ` · bis ${fmtDateTime(c.ends_at)}` : ""}
                    {c.type === "multiplier" ? ` · ${n} ${n === 1 ? "Buchung" : "Buchungen"} mit Aktion` : ""}
                  </p>
                </div>
                {canManage && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!st.ended && (
                      <form action={setCampaignActive.bind(null, c.id, !c.active)}>
                        <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">{c.active ? "Pausieren" : "Aktivieren"}</SubmitButton>
                      </form>
                    )}
                    {!st.ended && (
                      <form action={endCampaign.bind(null, c.id)}>
                        <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">Beenden</SubmitButton>
                      </form>
                    )}
                    {n === 0 && (
                      <form action={deleteCampaign.bind(null, c.id)}>
                        <SubmitButton className="btn btn-danger btn-sm" pendingText="…">Löschen</SubmitButton>
                      </form>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
