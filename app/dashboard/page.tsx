import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const { org } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  const supabase = createClient();
  const [progs, cards, custs, redeems] = await Promise.all([
    supabase.from("loyalty_programs").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("cards").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("reward_redemptions").select("id", { count: "exact", head: true }).eq("org_id", org.id),
  ]);

  const stats = [
    { label: "Programme", value: progs.count ?? 0 },
    { label: "Ausgegebene Karten", value: cards.count ?? 0 },
    { label: "Kunden", value: custs.count ?? 0 },
    { label: "Eingelöste Belohnungen", value: redeems.count ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Übersicht</h1>
      <p className="text-neutral-400 text-sm mb-6">{org.name}</p>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xs text-neutral-400">{s.label}</div>
            <div className="text-3xl font-bold mt-2">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
