import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { categoryLabel, normalizeHours, WEEKDAYS } from "@/lib/directory";
import { costText, fmtDate, fmtDateTime, programTypeLabel, safeUrl } from "@/lib/programs";
import { computeBillingInfo } from "@/lib/billing/access";
import { BusinessAvatar } from "@/components/site/BusinessCard";
import SubmitButton from "@/components/SubmitButton";
import { deactivateReward, reviewBusiness } from "@/app/admin/moderation-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil prüfen" };

const STATUS_LABEL: Record<string, string> = {
  draft: "Entwurf",
  pending: "In Prüfung",
  approved: "Freigeschaltet",
  rejected: "Abgelehnt",
  paused: "Pausiert",
};
const DECISION_LABEL: Record<string, string> = {
  approved: "Freigeschaltet",
  rejected: "Abgelehnt",
  paused: "Pausiert",
  unpaused: "Pause aufgehoben",
};

export default async function PruefungDetail({ params, searchParams }: { params: { orgId: string }; searchParams: { ok?: string; fehler?: string } }) {
  const db = createAdminClient();
  const { data: bp } = await db.from("business_profiles").select("*, organizations(*)").eq("org_id", params.orgId).maybeSingle();
  if (!bp) notFound();
  const org = (bp as any).organizations;

  const [{ data: owner }, { data: programs }, { data: rewards }, { data: reviews }, { count: cardCount }, { data: reports }] = await Promise.all([
    db.from("profiles").select("email, full_name").eq("id", org.owner_id).maybeSingle(),
    db.from("loyalty_programs").select("id, name, title, type, stamps_required, points_per_reward, active").eq("org_id", params.orgId),
    db.from("rewards").select("id, program_id, title, cost_points, conditions, active, ended_at, is_default").eq("org_id", params.orgId).order("cost_points"),
    db.from("business_reviews").select("decision, note, created_at").eq("org_id", params.orgId).order("created_at", { ascending: false }).limit(20),
    db.from("cards").select("id", { count: "exact", head: true }).eq("org_id", params.orgId),
    db.from("content_reports").select("id, reason, status, created_at").eq("org_id", params.orgId).order("created_at", { ascending: false }).limit(10),
  ]);

  const billing = computeBillingInfo(org);
  const hours = normalizeHours(bp.opening_hours);
  const website = safeUrl(bp.website);
  const status = bp.listing_status as string;

  return (
    <div className="space-y-6">
      <Link href="/admin/pruefungen" className="text-sm text-muted hover:text-accent">
        ← Alle Prüfungen
      </Link>
      {searchParams.ok && <p role="status" className="rounded-xl bg-forest/10 px-4 py-3 text-sm font-medium text-forest">{searchParams.ok}</p>}
      {searchParams.fehler && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{searchParams.fehler}</p>}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <BusinessAvatar name={bp.display_name} logoUrl={bp.logo_url} size={64} />
          <div>
            <h1 className="font-display text-[28px] font-semibold leading-tight">{bp.display_name}</h1>
            <p className="text-sm text-muted">
              {categoryLabel(bp.category)} · {bp.city || "kein Ort"} · Slug <code>{bp.slug}</code>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="badge badge-accent">{STATUS_LABEL[status] ?? status}</span>
              <span className={`badge ${billing.state === "active" ? "badge-forest" : "badge-warn"}`}>
                {billing.state === "active" ? "Abo/Test aktiv" : "Abo inaktiv"}
              </span>
              {org.admin_suspended && <span className="badge badge-danger">Betrieb gesperrt</span>}
              {!bp.is_listed && <span className="badge badge-muted">vom Betrieb ausgeblendet</span>}
            </div>
          </div>
        </div>
        <Link href={`/admin/organizations/${params.orgId}`} className="btn btn-ghost btn-sm">
          Betrieb ansehen
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-display text-xl font-semibold">Profilinhalt</h2>
            {bp.tagline && <p className="mt-3 font-medium">{bp.tagline}</p>}
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-muted">{bp.description || "– keine Beschreibung –"}</p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-faint">Adresse</dt><dd>{[bp.address, [bp.postal_code, bp.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "–"}</dd></div>
              <div><dt className="text-faint">Telefon</dt><dd>{bp.phone || "–"}</dd></div>
              <div><dt className="text-faint">E-Mail</dt><dd>{bp.public_email || "–"}</dd></div>
              <div><dt className="text-faint">Website</dt><dd>{website ? <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="text-accent">{website}</a> : "–"}</dd></div>
              <div><dt className="text-faint">Instagram</dt><dd>{bp.instagram || "–"}</dd></div>
              <div>
                <dt className="text-faint">Öffnungszeiten</dt>
                <dd>{hours.some((h) => !h.closed) ? hours.filter((h) => !h.closed).map((h) => `${WEEKDAYS[h.day].slice(0, 2)} ${h.open}–${h.close}`).join(", ") : "–"}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-xl font-semibold">Programme & Belohnungen</h2>
            <p className="mt-1 text-sm text-muted">{cardCount ?? 0} ausgegebene Karten</p>
            {(programs ?? []).length === 0 && <p className="mt-3 text-sm text-muted">Noch kein Programm angelegt.</p>}
            {(programs ?? []).map((p: any) => (
              <div key={p.id} className="mt-4 rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{p.title || p.name}</span>
                  <span className="badge badge-muted">{programTypeLabel(p.type)}</span>
                  {!p.active && <span className="badge badge-warn">pausiert</span>}
                </div>
                <ul className="mt-3 space-y-2">
                  {(rewards ?? [])
                    .filter((r: any) => r.program_id === p.id)
                    .map((r: any) => (
                      <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                        <span>
                          {r.title} · {costText(p.type, r.cost_points)}
                          {r.conditions ? ` · ${r.conditions}` : ""}
                          {!r.active || r.ended_at ? <span className="ml-2 text-faint">(inaktiv)</span> : null}
                        </span>
                        {r.active && !r.ended_at && (
                          <form action={deactivateReward} className="flex items-center gap-2">
                            <input type="hidden" name="orgId" value={params.orgId} />
                            <input type="hidden" name="rewardId" value={r.id} />
                            <input name="note" className="input !min-h-[34px] !py-1 text-sm w-44" placeholder="Grund (optional)" aria-label="Grund" />
                            <SubmitButton className="btn btn-danger btn-sm" pendingText="…">Sperren</SubmitButton>
                          </form>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-display text-xl font-semibold">Entscheidung</h2>
            <p className="mt-1 text-sm text-muted">
              Inhaber: {owner?.full_name || "–"} ({owner?.email ?? "–"}) · eingereicht {fmtDate(bp.submitted_at) || "–"}
            </p>
            <form action={reviewBusiness} className="mt-4 space-y-3">
              <input type="hidden" name="orgId" value={params.orgId} />
              <div>
                <label htmlFor="note" className="label">Begründung / Hinweis an den Betrieb</label>
                <textarea id="note" name="note" className="input" maxLength={1000} placeholder="Pflicht bei Ablehnung und Pause" />
              </div>
              <div className="flex flex-wrap gap-2">
                {["pending", "rejected", "draft"].includes(status) && (
                  <button type="submit" name="decision" value="approved" className="btn btn-forest">Freischalten</button>
                )}
                {status === "pending" && (
                  <button type="submit" name="decision" value="rejected" className="btn btn-danger">Ablehnen</button>
                )}
                {status === "approved" && (
                  <button type="submit" name="decision" value="paused" className="btn btn-danger">Pausieren</button>
                )}
                {status === "paused" && (
                  <button type="submit" name="decision" value="unpaused" className="btn btn-forest">Pause aufheben</button>
                )}
              </div>
              <p className="hint">Nur Superadmins. Jede Entscheidung wird im Audit-Protokoll und im Verlauf des Betriebs gespeichert.</p>
            </form>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-xl font-semibold">Verlauf</h2>
            {(reviews ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-muted">Noch keine Entscheidungen.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {(reviews ?? []).map((r: any, i: number) => (
                  <li key={i}>
                    <span className="font-semibold">{DECISION_LABEL[r.decision] ?? r.decision}</span> · {fmtDateTime(r.created_at)}
                    {r.note && <p className="text-muted">„{r.note}“</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(reports ?? []).length > 0 && (
            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold">Meldungen</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {(reports ?? []).map((r: any) => (
                  <li key={r.id}>
                    {r.reason} · {r.status} · {fmtDate(r.created_at)}
                  </li>
                ))}
              </ul>
              <Link href="/admin/meldungen" className="btn btn-ghost btn-sm mt-3">Zu den Meldungen</Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
