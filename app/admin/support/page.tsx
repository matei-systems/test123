import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const STATUS_LABEL: Record<string, string> = { open: "Offen", in_progress: "In Bearbeitung", resolved: "Gelöst", closed: "Geschlossen" };
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  open: { bg: "rgba(232,181,115,0.14)", fg: "#E8B573" },
  in_progress: { bg: "rgba(96,165,250,0.14)", fg: "#93C5FD" },
  resolved: { bg: "rgba(74,222,128,0.12)", fg: "#86EFAC" },
  closed: { bg: "rgba(148,148,148,0.14)", fg: "#C9C4BC" },
};
const PRIORITY_LABEL: Record<string, string> = { low: "Niedrig", normal: "Normal", high: "Hoch", urgent: "Dringend" };

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: { status?: string; priority?: string; page?: string };
}) {
  const db = createAdminClient();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = db
    .from("support_tickets")
    .select("id,subject,status,priority,created_at,updated_at,organizations(name)", { count: "exact" });
  if (searchParams.status) query = query.eq("status", searchParams.status);
  else query = query.in("status", ["open", "in_progress"]);
  if (searchParams.priority) query = query.eq("priority", searchParams.priority);

  const { data: tickets, count } = await query.order("updated_at", { ascending: false }).range(from, to);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (searchParams.status) params.set("status", searchParams.status);
    if (searchParams.priority) params.set("priority", searchParams.priority);
    params.set("page", String(p));
    return `/admin/support?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Support</h1>
        <p className="text-dim text-sm">Support-Fälle aller Betriebe</p>
      </div>

      <form method="get" className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Status</label>
          <select name="status" defaultValue={searchParams.status ?? ""} className="input text-sm">
            <option value="">Offen &amp; in Bearbeitung</option>
            <option value="open">Offen</option>
            <option value="in_progress">In Bearbeitung</option>
            <option value="resolved">Gelöst</option>
            <option value="closed">Geschlossen</option>
          </select>
        </div>
        <div>
          <label className="label">Priorität</label>
          <select name="priority" defaultValue={searchParams.priority ?? ""} className="input text-sm">
            <option value="">Alle</option>
            {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary text-sm">Filtern</button>
      </form>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-faint">
              <th className="p-4 font-medium">Betreff</th>
              <th className="p-4 font-medium">Betrieb</th>
              <th className="p-4 font-medium">Priorität</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Aktualisiert</th>
            </tr>
          </thead>
          <tbody>
            {(tickets ?? []).map((t: any) => {
              const color = STATUS_COLOR[t.status] ?? STATUS_COLOR.open;
              return (
                <tr key={t.id} className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02]">
                  <td className="p-4">
                    <Link href={`/admin/support/${t.id}`} className="font-medium text-gold hover:text-gold-bright">
                      {t.subject}
                    </Link>
                  </td>
                  <td className="p-4 text-dim">{t.organizations?.name ?? "-"}</td>
                  <td className="p-4 text-faint">{PRIORITY_LABEL[t.priority] ?? t.priority}</td>
                  <td className="p-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: color.bg, color: color.fg }}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="p-4 text-faint">{fmtDate(t.updated_at)}</td>
                </tr>
              );
            })}
            {(tickets ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-faint">Keine Support-Fälle gefunden.</td>
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
