import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type BillingInterval } from "@/lib/billing/plans";

// Alle Zählungen laufen als einzelne, durch Indizes gedeckte
// Head-Count-Anfragen (count(*) mit maximal einem Gleichheits-/Bereichs-
// Filter) - bei Tausenden Organisationen bleibt das schnell, ohne dass der
// Admin-Bereich je die komplette organizations-Tabelle in den Speicher
// laden müsste. Eine echte GROUP-BY-Aggregation über PostgREST würde noch
// weniger Anfragen brauchen, ist aber im lokalen Test-Shim nicht
// nachgebildet - bei sehr vielen Tarifen/Status-Kombinationen wäre das der
// nächste Skalierungsschritt (siehe docs/OPTIMIZATION_BACKLOG.md).
async function headCount(db: ReturnType<typeof createAdminClient>, table: string, apply?: (q: any) => any) {
  let q = db.from(table).select("*", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count, error } = await q;
  if (error) throw new Error(`[admin/stats] Zählung auf ${table} fehlgeschlagen: ${error.message}`);
  return count ?? 0;
}

export interface PlanBreakdownEntry {
  planId: string;
  name: string;
  monthly: number;
  yearly: number;
  mrrCents: number;
}

export interface PlatformStats {
  totalOrgs: number;
  activeSubscriptions: number;
  trialing: number;
  restricted: number;
  suspended: number;
  totalUsers: number;
  totalCustomers: number;
  totalCards: number;
  transactions30d: number;
  openTickets: number;
  mrrCents: number;
  planBreakdown: PlanBreakdownEntry[];
  signupsPerDay: { date: string; count: number }[];
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const db = createAdminClient();
  const nowIso = new Date().toISOString();
  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalOrgs,
    activeSubscriptions,
    trialingStripe,
    trialingApp,
    pastDueOrCanceled,
    trialExpired,
    suspended,
    totalUsers,
    totalCustomers,
    totalCards,
    transactions30d,
    openTickets,
  ] = await Promise.all([
    headCount(db, "organizations"),
    headCount(db, "organizations", (q) => q.eq("subscription_status", "active")),
    headCount(db, "organizations", (q) => q.eq("subscription_status", "trialing")),
    headCount(db, "organizations", (q) => q.is("subscription_status", null).gt("trial_ends_at", nowIso)),
    headCount(db, "organizations", (q) =>
      q.in("subscription_status", ["past_due", "unpaid", "incomplete", "incomplete_expired", "paused", "canceled"])
    ),
    headCount(db, "organizations", (q) => q.is("subscription_status", null).lte("trial_ends_at", nowIso)),
    headCount(db, "organizations", (q) => q.eq("admin_suspended", true)),
    headCount(db, "profiles"),
    headCount(db, "customers"),
    headCount(db, "cards"),
    headCount(db, "transactions", (q) => q.gte("created_at", thirtyDaysAgoIso)),
    headCount(db, "support_tickets", (q) => q.in("status", ["open", "in_progress"])),
  ]);

  const planBreakdown: PlanBreakdownEntry[] = [];
  let mrrCents = 0;
  for (const plan of PLANS) {
    let monthly = 0;
    let yearly = 0;
    for (const interval of ["monthly", "yearly"] as BillingInterval[]) {
      const n = await headCount(db, "organizations", (q) =>
        q.eq("plan_id", plan.id).eq("billing_interval", interval).eq("subscription_status", "active")
      );
      if (interval === "monthly") monthly = n;
      else yearly = n;
    }
    const contributionCents = monthly * plan.displayPriceMonthly * 100 + yearly * Math.round((plan.displayPriceYearly / 12) * 100);
    mrrCents += contributionCents;
    planBreakdown.push({ planId: plan.id, name: plan.name, monthly, yearly, mrrCents: contributionCents });
  }

  // Wachstums-Chart: Zeitfenster ist auf 30 Tage begrenzt, daher unabhängig
  // von der Gesamtzahl der Organisationen immer eine kleine, beschränkte
  // Ergebnismenge - Bucketing nach Tag passiert bewusst in JS statt per
  // GROUP BY (siehe Kommentar zu headCount oben).
  const { data: recentOrgs, error: recentErr } = await db
    .from("organizations")
    .select("created_at")
    .gte("created_at", thirtyDaysAgoIso);
  if (recentErr) throw new Error(`[admin/stats] Neuanmeldungen konnten nicht geladen werden: ${recentErr.message}`);

  const buckets = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of recentOrgs ?? []) {
    const key = String((row as any).created_at).slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const signupsPerDay = Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));

  return {
    totalOrgs,
    activeSubscriptions,
    trialing: trialingStripe + trialingApp,
    restricted: pastDueOrCanceled + trialExpired,
    suspended,
    totalUsers,
    totalCustomers,
    totalCards,
    transactions30d,
    openTickets,
    mrrCents,
    planBreakdown,
    signupsPerDay,
  };
}
