import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

const ICONS = {
  programs: (
    <path d="M4 4h16v4H4zM4 10h16v10H4z" />
  ),
  cards: (
    <path d="M3 6h18v4H3zM3 12h18v6H3z" />
  ),
  customers: (
    <path d="M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21a8 8 0 0116 0" />
  ),
  rewards: (
    <path d="M12 2l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8L6.7 18.6l1-6L3.3 8.4l6-.9z" />
  ),
};

function StatCard({
  label,
  value,
  icon,
  delay,
}: {
  label: string;
  value: number;
  icon: keyof typeof ICONS;
  delay: number;
}) {
  return (
    <div className="card card-hover p-5 enter" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-10 h-10 rounded-lg grid place-items-center bg-[rgba(232,181,115,0.12)] text-gold mb-4">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[icon]}
        </svg>
      </div>
      <div className="text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="text-xs text-[#A6A099] mt-1">{label}</div>
    </div>
  );
}

const TX_LABEL: Record<string, string> = {
  stamp: "Stempel vergeben",
  points: "Punkte vergeben",
  redeem: "Belohnung eingelöst",
  adjust: "Anpassung",
};

export default async function DashboardHome() {
  const { org } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  const supabase = createClient();
  const [progs, cards, custs, redeems, activity] = await Promise.all([
    supabase.from("loyalty_programs").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("cards").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("reward_redemptions").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase
      .from("transactions")
      .select("id, type, amount, created_at, cards(customers(full_name), loyalty_programs(title, name))")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const stats: { label: string; value: number; icon: keyof typeof ICONS }[] = [
    { label: "Programme", value: progs.count ?? 0, icon: "programs" },
    { label: "Ausgegebene Karten", value: cards.count ?? 0, icon: "cards" },
    { label: "Kunden", value: custs.count ?? 0, icon: "customers" },
    { label: "Eingelöste Belohnungen", value: redeems.count ?? 0, icon: "rewards" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Übersicht</h1>
      <p className="text-[#A6A099] text-sm mb-6">{org.name}</p>

      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 60} />
        ))}
      </div>

      <div className="card p-5 md:p-6 enter" style={{ animationDelay: "240ms" }}>
        <div className="font-semibold text-sm text-[#F4F1EC] mb-4">Letzte Aktivität</div>
        <div className="space-y-1">
          {(activity.data ?? []).map((tx: any) => {
            const customerName = tx.cards?.customers?.full_name ?? "Kunde";
            const programTitle = tx.cards?.loyalty_programs?.title ?? tx.cards?.loyalty_programs?.name ?? "Programm";
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-4 py-2.5 border-t first:border-t-0 border-white/[0.06]"
              >
                <div className="min-w-0">
                  <div className="text-sm text-[#F4F1EC] truncate">
                    <span className="font-medium">{customerName}</span> · {TX_LABEL[tx.type] ?? tx.type}
                  </div>
                  <div className="text-xs text-[#6E685F] truncate">{programTitle}</div>
                </div>
                <div className="text-xs text-[#A6A099] shrink-0">{timeAgo(tx.created_at)}</div>
              </div>
            );
          })}
          {(!activity.data || activity.data.length === 0) && (
            <div className="text-sm text-[#6E685F] py-6 text-center">
              Noch keine Aktivität.{" "}
              <Link href="/dashboard/programs" className="text-gold hover:text-gold-bright">
                Leg dein erstes Programm an
              </Link>{" "}
              und gib den ersten Stempel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
