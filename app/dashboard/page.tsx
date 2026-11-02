import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/time";
import { hasMinRole } from "@/lib/permissions";

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
      <div className="w-10 h-10 rounded-lg grid place-items-center bg-accent-strong/[0.12] text-gold mb-4">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[icon]}
        </svg>
      </div>
      <div className="font-display text-[34px] font-semibold leading-none tabular">{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
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
  const { org, role } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  const supabase = createClient();
  const now = Date.now();
  const since = (days: number) => new Date(now - days * 86_400_000).toISOString();
  const [progs, cards, custs, redeems, activity, profile, recentTx, newCards30] = await Promise.all([
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
    supabase.from("business_profiles").select("listing_status, is_listed, slug").eq("org_id", org.id).maybeSingle(),
    supabase.from("transactions").select("type, created_at, card_id").eq("org_id", org.id).gte("created_at", since(30)).limit(5000),
    supabase.from("cards").select("id", { count: "exact", head: true }).eq("org_id", org.id).gte("created_at", since(30)),
  ]);

  // Einfache Kennzahlen aus echten Buchungen der letzten 30 Tage
  const tx = (recentTx.data ?? []) as { type: string; created_at: string; card_id: string }[];
  const earn = tx.filter((t) => t.type === "stamp" || t.type === "points");
  const earn7 = earn.filter((t) => t.created_at >= since(7)).length;
  const redeem30 = tx.filter((t) => t.type === "redeem").length;
  const activeCards30 = new Set(tx.map((t) => t.card_id)).size;
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    return { key, label: new Intl.DateTimeFormat("de-AT", { weekday: "short" }).format(d), count: earn.filter((t) => t.created_at.slice(0, 10) === key).length };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.count));
  const bp = profile.data as { listing_status: string; is_listed: boolean; slug: string } | null;
  const canManage = hasMinRole(role, "admin");

  const stats: { label: string; value: number; icon: keyof typeof ICONS }[] = [
    { label: "Programme", value: progs.count ?? 0, icon: "programs" },
    { label: "Ausgegebene Karten", value: cards.count ?? 0, icon: "cards" },
    { label: "Kunden", value: custs.count ?? 0, icon: "customers" },
    { label: "Eingelöste Belohnungen", value: redeems.count ?? 0, icon: "rewards" },
  ];

  return (
    <div>
      <h1 className="font-display text-[30px] font-semibold leading-tight mb-1">Übersicht</h1>
      <p className="text-muted text-sm mb-6">{org.name}</p>

      {bp && bp.listing_status !== "approved" && (
        <div className={`mb-6 flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${bp.listing_status === "rejected" || bp.listing_status === "paused" ? "border-danger/30 bg-danger/5" : "border-line bg-surface"}`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`badge ${bp.listing_status === "pending" ? "badge-warn" : bp.listing_status === "draft" ? "badge-muted" : "badge-danger"}`}>
                Profil: {bp.listing_status === "pending" ? "In Prüfung" : bp.listing_status === "draft" ? "Entwurf" : bp.listing_status === "rejected" ? "Abgelehnt" : "Pausiert"}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">
              {bp.listing_status === "draft" && "Damit Kundinnen und Kunden dich unter „Geschäfte entdecken“ finden, fülle dein Profil aus und reiche es zur Prüfung ein."}
              {bp.listing_status === "pending" && "Wir prüfen dein Profil. Deine Treuekarten funktionieren währenddessen ganz normal."}
              {bp.listing_status === "rejected" && "Die Prüfung war nicht erfolgreich – die Begründung findest du im Profil."}
              {bp.listing_status === "paused" && "Dein Profil wurde pausiert und ist nicht öffentlich sichtbar."}
            </p>
          </div>
          <Link href="/dashboard/profil" className="btn btn-primary btn-sm shrink-0">
            {bp.listing_status === "draft" && canManage ? "Profil ausfüllen" : "Zum Profil"}
          </Link>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/dashboard/scan", label: "Scannen", hint: "Stempel & Einlösen" },
          { href: "/dashboard/belohnungen", label: "Belohnungen", hint: "Katalog pflegen" },
          { href: "/dashboard/aktionen", label: "Aktionen", hint: "z. B. doppelte Stempel" },
          { href: "/dashboard/profil", label: "Profil", hint: bp?.listing_status === "approved" ? "Freigeschaltet" : "Prüfstatus" },
        ].map((t) => (
          <Link key={t.href} href={t.href} className="card card-hover p-4">
            <div className="font-semibold">{t.label}</div>
            <div className="text-xs text-muted mt-0.5">{t.hint}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 60} />
        ))}
      </div>

      <div className="grid gap-4 mb-8 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-5 md:p-6" aria-labelledby="chart-h">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="chart-h" className="font-semibold text-sm text-fg">Buchungen der letzten 14 Tage</h2>
            <span className="text-xs text-muted">{earn.length} in 30 Tagen</span>
          </div>
          {earn.length === 0 ? (
            <p className="mt-6 text-sm text-faint">Noch keine Buchungen in diesem Zeitraum. Sobald du Karten scannst, erscheinen sie hier.</p>
          ) : (
            <div className="mt-5 flex h-36 items-end gap-1.5" role="img" aria-label={`Buchungen pro Tag, höchster Wert ${maxDay}`}>
              {days.map((d) => (
                <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="w-full rounded-t-md bg-stamp/80" style={{ height: `${Math.max(d.count ? 6 : 2, (d.count / maxDay) * 112)}px`, opacity: d.count ? 1 : 0.25 }} title={`${d.count} am ${d.key}`} />
                  <span className="text-[10px] text-faint">{d.label.slice(0, 2)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="card p-5 md:p-6" aria-labelledby="kpi-h">
          <h2 id="kpi-h" className="font-semibold text-sm text-fg">Kennzahlen</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            {[
              { label: "Buchungen (7 Tage)", value: earn7 },
              { label: "Einlösungen (30 Tage)", value: redeem30 },
              { label: "Aktive Karten (30 Tage)", value: activeCards30 },
              { label: "Neue Karten (30 Tage)", value: newCards30.count ?? 0 },
            ].map((k) => (
              <div key={k.label}>
                <dt className="text-xs text-muted">{k.label}</dt>
                <dd className="font-display text-2xl font-semibold tabular">{k.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="card p-5 md:p-6 enter" style={{ animationDelay: "240ms" }}>
        <div className="font-semibold text-sm text-fg mb-4">Letzte Aktivität</div>
        <div className="space-y-1">
          {(activity.data ?? []).map((tx: any) => {
            const customerName = tx.cards?.customers?.full_name ?? "Kunde";
            const programTitle = tx.cards?.loyalty_programs?.title ?? tx.cards?.loyalty_programs?.name ?? "Programm";
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-4 py-2.5 border-t first:border-t-0 border-line"
              >
                <div className="min-w-0">
                  <div className="text-sm text-fg truncate">
                    <span className="font-medium">{customerName}</span> · {TX_LABEL[tx.type] ?? tx.type}
                  </div>
                  <div className="text-xs text-faint truncate">{programTitle}</div>
                </div>
                <div className="text-xs text-muted shrink-0">{timeAgo(tx.created_at)}</div>
              </div>
            );
          })}
          {(!activity.data || activity.data.length === 0) && (
            <div className="text-sm text-faint py-6 text-center">
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
