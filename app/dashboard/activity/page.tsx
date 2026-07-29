import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { hasMinRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  stamp: "Stempel vergeben",
  points: "Punkte vergeben",
  redeem: "Belohnung eingelöst",
  adjust: "Korrektur",
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: { staff?: string; type?: string; range?: string };
}) {
  const { org, role } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");
  if (!hasMinRole(role, "admin")) redirect("/dashboard");

  const supabase = createClient();

  let query = supabase
    .from("transactions")
    .select("id, type, amount, created_at, staff_id, cards(customers(full_name), loyalty_programs(title, name)), locations(name)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(300);

  if (searchParams.type) query = query.eq("type", searchParams.type);
  if (searchParams.staff) query = query.eq("staff_id", searchParams.staff);
  if (searchParams.range === "7" || searchParams.range === "30") {
    const days = Number(searchParams.range);
    query = query.gte("created_at", new Date(Date.now() - days * 86400000).toISOString());
  }

  const { data: transactions } = await query;

  const staffIds = Array.from(new Set((transactions ?? []).map((t: any) => t.staff_id).filter(Boolean)));
  const staffMap = new Map<string, { email: string | null; full_name: string | null }>();
  if (staffIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, email, full_name").in("id", staffIds);
    (profiles ?? []).forEach((p: any) => staffMap.set(p.id, p));
  }

  const { data: members } = await supabase
    .from("memberships")
    .select("user_id, profiles(email, full_name)")
    .eq("org_id", org.id);

  const hasFilters = Boolean(searchParams.staff || searchParams.type || searchParams.range);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Aktivität</h1>
        <p className="text-[#A6A099] text-sm">Wer hat wann welchen Stempel vergeben oder eine Belohnung eingelöst.</p>
      </div>

      <form method="get" className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Mitarbeiter</label>
          <select name="staff" defaultValue={searchParams.staff ?? ""} className="input text-sm">
            <option value="">Alle</option>
            {(members ?? []).map((m: any) => (
              <option key={m.user_id} value={m.user_id}>
                {m.profiles?.full_name || m.profiles?.email || m.user_id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Typ</label>
          <select name="type" defaultValue={searchParams.type ?? ""} className="input text-sm">
            <option value="">Alle</option>
            <option value="stamp">Stempel</option>
            <option value="points">Punkte</option>
            <option value="redeem">Einlösungen</option>
          </select>
        </div>
        <div>
          <label className="label">Zeitraum</label>
          <select name="range" defaultValue={searchParams.range ?? ""} className="input text-sm">
            <option value="">Gesamt</option>
            <option value="7">Letzte 7 Tage</option>
            <option value="30">Letzte 30 Tage</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary text-sm">
          Filtern
        </button>
        {hasFilters && (
          <Link href="/dashboard/activity" className="btn btn-ghost text-sm">
            Zurücksetzen
          </Link>
        )}
      </form>

      <div className="space-y-2">
        {(transactions ?? []).map((t: any) => {
          const staff = t.staff_id ? staffMap.get(t.staff_id) : null;
          const customer = t.cards?.customers?.full_name ?? "Kunde";
          const program = t.cards?.loyalty_programs?.title ?? t.cards?.loyalty_programs?.name ?? "Programm";
          return (
            <div key={t.id} className="card p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {TYPE_LABEL[t.type] ?? t.type} · {customer}
                </div>
                <div className="text-xs text-[#A6A099]">
                  {program}
                  {t.locations?.name && ` · ${t.locations.name}`} ·{" "}
                  {staff ? staff.full_name || staff.email : "Unbekannt (manuell/System)"}
                </div>
              </div>
              <div className="text-xs text-faint shrink-0">
                {new Date(t.created_at).toLocaleString("de-AT", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          );
        })}
        {(!transactions || transactions.length === 0) && (
          <div className="text-[#6E685F] text-sm">Noch keine Aktivität{hasFilters ? " für diesen Filter" : ""}.</div>
        )}
      </div>
    </div>
  );
}
