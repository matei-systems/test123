import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { categoryLabel } from "@/lib/directory";
import { fmtDate } from "@/lib/programs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prüfungen" };

const TABS = [
  { key: "pending", label: "In Prüfung" },
  { key: "approved", label: "Freigeschaltet" },
  { key: "paused", label: "Pausiert" },
  { key: "rejected", label: "Abgelehnt" },
  { key: "draft", label: "Entwürfe" },
];

export default async function PruefungenPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = TABS.some((t) => t.key === searchParams.status) ? searchParams.status! : "pending";
  const db = createAdminClient();
  const [{ data: rows }, ...counts] = await Promise.all([
    db
      .from("business_profiles")
      .select("org_id, slug, display_name, category, city, listing_status, is_listed, submitted_at, approved_at, updated_at, organizations(name, admin_suspended)")
      .eq("listing_status", status)
      .order(status === "pending" ? "submitted_at" : "updated_at", { ascending: status === "pending" })
      .limit(200),
    ...TABS.map((t) => db.from("business_profiles").select("org_id", { count: "exact", head: true }).eq("listing_status", t.key)),
  ]);

  return (
    <div>
      <h1 className="font-display text-[30px] font-semibold leading-tight">Geschäftsprofile prüfen</h1>
      <p className="mt-1 text-sm text-muted">Nur freigeschaltete Profile mit aktivem Abo erscheinen im öffentlichen Verzeichnis.</p>

      <nav aria-label="Status" className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <Link key={t.key} href={`/admin/pruefungen?status=${t.key}`} className="chip" aria-current={status === t.key ? "true" : undefined}>
            {t.label}
            <span className="tabular opacity-70">{counts[i].count ?? 0}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-6 overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-faint">
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-semibold">Geschäft</th>
              <th className="px-4 py-3 font-semibold">Kategorie / Ort</th>
              <th className="px-4 py-3 font-semibold">{status === "pending" ? "Eingereicht" : "Zuletzt geändert"}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  {status === "pending" ? "Keine offenen Prüfungen. 🎉" : "Keine Einträge."}
                </td>
              </tr>
            )}
            {(rows ?? []).map((r: any) => (
              <tr key={r.org_id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <div className="font-semibold">{r.display_name}</div>
                  <div className="text-xs text-faint">
                    {r.organizations?.name}
                    {r.organizations?.admin_suspended ? " · Betrieb gesperrt" : ""}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">
                  {r.category ? categoryLabel(r.category) : "–"} · {r.city || "–"}
                </td>
                <td className="px-4 py-3 text-muted">{fmtDate(status === "pending" ? r.submitted_at : r.updated_at) || "–"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/pruefungen/${r.org_id}`} className="btn btn-ghost btn-sm">
                    {status === "pending" ? "Prüfen" : "Ansehen"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
