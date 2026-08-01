import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/billing/plans";
import { getPlatformStats } from "@/lib/admin/stats";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  trialing: "Trialing",
  past_due: "Zahlung überfällig",
  unpaid: "Unbezahlt",
  canceled: "Gekündigt",
  incomplete: "Unvollständig",
  incomplete_expired: "Abgelaufen",
  paused: "Pausiert",
};
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  active: { bg: "rgba(74,222,128,0.12)", fg: "#86EFAC" },
  trialing: { bg: "rgba(232,181,115,0.14)", fg: "#E8B573" },
  past_due: { bg: "rgba(239,68,68,0.12)", fg: "#FCA5A5" },
  unpaid: { bg: "rgba(239,68,68,0.12)", fg: "#FCA5A5" },
  canceled: { bg: "rgba(148,148,148,0.14)", fg: "#C9C4BC" },
};

function fmtEUR(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function mrrContribution(planId: string | null, interval: string | null): number {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return 0;
  return interval === "yearly" ? Math.round((plan.displayPriceYearly / 12) * 100) : plan.displayPriceMonthly * 100;
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: { status?: string; plan?: string; page?: string };
}) {
  const db = createAdminClient();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = db
    .from("organizations")
    .select("id,name,plan_id,billing_interval,subscription_status,current_period_end,cancel_at_period_end,trial_ends_at", {
      count: "exact",
    })
    .not("subscription_status", "is", null);

  if (searchParams.status) query = query.eq("subscription_status", searchParams.status);
  if (searchParams.plan) query = query.eq("plan_id", searchParams.plan);

  const { data: orgs, count } = await query.order("current_period_end", { ascending: true }).range(from, to);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const stats = await getPlatformStats();

  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (searchParams.status) params.set("status", searchParams.status);
    if (searchParams.plan) params.set("plan", searchParams.plan);
    params.set("page", String(p));
    return `/admin/subscriptions?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Abonnements</h1>
        <p className="text-dim text-sm">Alle Betriebe mit einem Stripe-Abo (aktiv oder in der Vergangenheit)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide text-faint mb-1">MRR gesamt</div>
          <div className="text-xl font-extrabold text-[#86EFAC]">{fmtEUR(stats.mrrCents)}</div>
        </div>
        {stats.planBreakdown.map((p) => (
          <div key={p.planId} className="card p-5">
            <div className="text-xs uppercase tracking-wide text-faint mb-1">{p.name}</div>
            <div className="text-xl font-extrabold">{p.monthly + p.yearly}</div>
            <div className="text-xs text-dim mt-0.5">{fmtEUR(p.mrrCents)} MRR</div>
          </div>
        ))}
      </div>

      <form method="get" className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Status</label>
          <select name="status" defaultValue={searchParams.status ?? ""} className="input text-sm">
            <option value="">Alle</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tarif</label>
          <select name="plan" defaultValue={searchParams.plan ?? ""} className="input text-sm">
            <option value="">Alle</option>
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary text-sm">Filtern</button>
        {(searchParams.status || searchParams.plan) && (
          <Link href="/admin/subscriptions" className="btn btn-ghost text-sm">Zurücksetzen</Link>
        )}
      </form>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-faint">
              <th className="p-4 font-medium">Betrieb</th>
              <th className="p-4 font-medium">Tarif</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">MRR-Beitrag</th>
              <th className="p-4 font-medium">Nächste Abrechnung / Ende</th>
            </tr>
          </thead>
          <tbody>
            {(orgs ?? []).map((org: any) => {
              const color = STATUS_COLOR[org.subscription_status] ?? STATUS_COLOR.canceled;
              const isActive = org.subscription_status === "active";
              return (
                <tr key={org.id} className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02]">
                  <td className="p-4">
                    <Link href={`/admin/organizations/${org.id}`} className="font-medium text-gold hover:text-gold-bright">
                      {org.name}
                    </Link>
                  </td>
                  <td className="p-4 text-dim">
                    {PLANS.find((p) => p.id === org.plan_id)?.name ?? org.plan_id ?? "-"}
                    {org.billing_interval && <span className="text-faint"> · {org.billing_interval === "monthly" ? "monatlich" : "jährlich"}</span>}
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: color.bg, color: color.fg }}>
                      {STATUS_LABEL[org.subscription_status] ?? org.subscription_status}
                    </span>
                  </td>
                  <td className="p-4 text-dim">{isActive ? fmtEUR(mrrContribution(org.plan_id, org.billing_interval)) : "-"}</td>
                  <td className="p-4 text-faint">
                    {org.current_period_end ? `${fmtDate(org.current_period_end)}${org.cancel_at_period_end ? " (endet)" : ""}` : "-"}
                  </td>
                </tr>
              );
            })}
            {(orgs ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-faint">Keine Abonnements gefunden.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-dim">
          <span>Seite {page} von {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={pageHref(page - 1)} className="btn btn-ghost text-sm">← Zurück</Link>}
            {page < totalPages && <Link href={pageHref(page + 1)} className="btn btn-ghost text-sm">Weiter →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
