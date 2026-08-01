import { getPlatformStats } from "@/lib/admin/stats";
import StatTile from "@/components/admin/StatTile";
import GrowthChart from "@/components/admin/GrowthChart";

export const dynamic = "force-dynamic";

function fmtEUR(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export default async function AdminOverviewPage() {
  const stats = await getPlatformStats();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Übersicht</h1>
        <p className="text-dim text-sm">Plattformweite Kennzahlen über alle Betriebe</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <StatTile label="Unternehmen gesamt" value={String(stats.totalOrgs)} />
        <StatTile label="Aktive Abos" value={String(stats.activeSubscriptions)} tone="good" />
        <StatTile label="In Testphase" value={String(stats.trialing)} />
        <StatTile
          label="Eingeschränkt"
          value={String(stats.restricted)}
          tone={stats.restricted > 0 ? "warning" : "default"}
        />
        <StatTile
          label="Gesperrt"
          value={String(stats.suspended)}
          tone={stats.suspended > 0 ? "critical" : "default"}
        />
        <StatTile label="MRR" value={fmtEUR(stats.mrrCents)} tone="good" sublabel="nur aktive Abos" />
        <StatTile label="Nutzer gesamt" value={String(stats.totalUsers)} />
        <StatTile label="Kund:innen gesamt" value={String(stats.totalCustomers)} />
        <StatTile label="Karten gesamt" value={String(stats.totalCards)} />
        <StatTile label="Buchungen (30 Tage)" value={String(stats.transactions30d)} sublabel="Stempel/Punkte/Einlösungen" />
        <StatTile
          label="Offene Support-Fälle"
          value={String(stats.openTickets)}
          tone={stats.openTickets > 0 ? "warning" : "good"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GrowthChart data={stats.signupsPerDay} />
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-bold tracking-tight mb-4">Tarif-Verteilung</h2>
          <div className="space-y-3">
            {stats.planBreakdown.map((p) => {
              const total = p.monthly + p.yearly;
              const share = stats.activeSubscriptions > 0 ? Math.round((total / stats.activeSubscriptions) * 100) : 0;
              return (
                <div key={p.planId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-dim">{total} · {fmtEUR(p.mrrCents)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full bg-gold-grad" style={{ width: `${share}%` }} />
                  </div>
                  <div className="text-[11px] text-faint mt-1">
                    {p.monthly} monatlich · {p.yearly} jährlich
                  </div>
                </div>
              );
            })}
            {stats.activeSubscriptions === 0 && (
              <p className="text-xs text-faint">Noch keine aktiven Abos.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
