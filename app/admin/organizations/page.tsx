import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  trialing: "Trialing (Stripe)",
  none: "App-Testphase",
  past_due: "Zahlung überfällig",
  unpaid: "Unbezahlt",
  canceled: "Gekündigt",
  incomplete: "Unvollständig",
};

function StatusBadge({ org }: { org: any }) {
  if (org.admin_suspended) {
    return (
      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.14)", color: "#FCA5A5" }}>
        Gesperrt
      </span>
    );
  }
  const status: string = org.subscription_status ?? "none";
  const isRestricted =
    ["past_due", "unpaid", "canceled", "incomplete", "incomplete_expired", "paused"].includes(status) ||
    (status === "none" && org.trial_ends_at && new Date(org.trial_ends_at).getTime() <= Date.now());
  const color = status === "active" ? { bg: "rgba(74,222,128,0.12)", fg: "#86EFAC" } : isRestricted ? { bg: "rgba(239,68,68,0.12)", fg: "#FCA5A5" } : { bg: "rgba(232,181,115,0.14)", fg: "#E8B573" };
  const label = isRestricted && status === "none" ? "Testphase abgelaufen" : STATUS_LABEL[status] ?? status;
  return (
    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: color.bg, color: color.fg }}>
      {label}
    </span>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; plan?: string; page?: string };
}) {
  const db = createAdminClient();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = db
    .from("organizations")
    .select("id,name,slug,plan_id,billing_interval,subscription_status,trial_ends_at,admin_suspended,created_at", {
      count: "exact",
    });

  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);
  if (searchParams.plan) query = query.eq("plan_id", searchParams.plan);
  if (searchParams.status) {
    if (searchParams.status === "none") query = query.is("subscription_status", null);
    else if (searchParams.status === "suspended") query = query.eq("admin_suspended", true);
    else query = query.eq("subscription_status", searchParams.status);
  }

  const { data: orgs, count } = await query.order("created_at", { ascending: false }).range(from, to);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.status) params.set("status", searchParams.status);
    if (searchParams.plan) params.set("plan", searchParams.plan);
    params.set("page", String(p));
    return `/admin/organizations?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Unternehmen</h1>
        <p className="text-dim text-sm">{total} {total === 1 ? "Betrieb" : "Betriebe"} auf der Plattform</p>
      </div>

      <form method="get" className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label">Suche</label>
          <input type="text" name="q" defaultValue={searchParams.q ?? ""} placeholder="Name des Betriebs…" className="input text-sm" />
        </div>
        <div>
          <label className="label">Status</label>
          <select name="status" defaultValue={searchParams.status ?? ""} className="input text-sm">
            <option value="">Alle</option>
            <option value="active">Aktiv</option>
            <option value="trialing">Trialing (Stripe)</option>
            <option value="none">App-Testphase</option>
            <option value="past_due">Zahlung überfällig</option>
            <option value="unpaid">Unbezahlt</option>
            <option value="canceled">Gekündigt</option>
            <option value="suspended">Gesperrt</option>
          </select>
        </div>
        <div>
          <label className="label">Tarif</label>
          <select name="plan" defaultValue={searchParams.plan ?? ""} className="input text-sm">
            <option value="">Alle</option>
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary text-sm">Filtern</button>
        {(searchParams.q || searchParams.status || searchParams.plan) && (
          <Link href="/admin/organizations" className="btn btn-ghost text-sm">
            Zurücksetzen
          </Link>
        )}
      </form>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-faint">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Tarif</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Angelegt</th>
            </tr>
          </thead>
          <tbody>
            {(orgs ?? []).map((org: any) => (
              <tr key={org.id} className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02]">
                <td className="p-4">
                  <Link href={`/admin/organizations/${org.id}`} className="font-medium text-gold hover:text-gold-bright">
                    {org.name}
                  </Link>
                  <div className="text-xs text-faint">{org.slug}</div>
                </td>
                <td className="p-4 text-dim">
                  {org.plan_id ? PLANS.find((p) => p.id === org.plan_id)?.name ?? org.plan_id : "-"}
                  {org.billing_interval && <span className="text-faint"> · {org.billing_interval === "monthly" ? "monatlich" : "jährlich"}</span>}
                </td>
                <td className="p-4">
                  <StatusBadge org={org} />
                </td>
                <td className="p-4 text-faint">{fmtDate(org.created_at)}</td>
              </tr>
            ))}
            {(orgs ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-faint">
                  Keine Betriebe gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-dim">
          <span>
            Seite {page} von {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="btn btn-ghost text-sm">
                ← Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className="btn btn-ghost text-sm">
                Weiter →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
