import { createAdminClient } from "@/lib/supabase/admin";
import { fmtDateTime } from "@/lib/programs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit-Protokoll" };

// Alle Admin-Aktionen (lib/admin.ts logAdminAction) - nur lesend.
export default async function AuditPage() {
  const db = createAdminClient();
  const { data: rows } = await db.from("admin_audit_log").select("id, admin_id, action, target_type, target_id, details, created_at").order("created_at", { ascending: false }).limit(300);
  const adminIds = Array.from(new Set((rows ?? []).map((r: any) => r.admin_id).filter(Boolean)));
  const { data: admins } = adminIds.length ? await db.from("profiles").select("id, email").in("id", adminIds) : { data: [] as any[] };
  const email = new Map((admins ?? []).map((a: any) => [a.id, a.email]));

  return (
    <div>
      <h1 className="font-display text-[30px] font-semibold leading-tight">Audit-Protokoll</h1>
      <p className="mt-1 text-sm text-muted">Jede Aktion im Admin-Panel (Freischaltungen, Sperren, Testphasen, Moderation) – die letzten 300 Einträge.</p>
      <div className="mt-6 overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-faint">
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-semibold">Zeitpunkt</th>
              <th className="px-4 py-3 font-semibold">Admin</th>
              <th className="px-4 py-3 font-semibold">Aktion</th>
              <th className="px-4 py-3 font-semibold">Ziel</th>
              <th className="px-4 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">Noch keine Einträge.</td>
              </tr>
            )}
            {(rows ?? []).map((r: any) => (
              <tr key={r.id} className="border-b border-line align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDateTime(r.created_at)}</td>
                <td className="px-4 py-3">{email.get(r.admin_id) ?? r.admin_id?.slice(0, 8) ?? "–"}</td>
                <td className="px-4 py-3 font-medium">{r.action}</td>
                <td className="px-4 py-3 text-muted">
                  {r.target_type}
                  {r.target_id ? <code className="ml-1 text-xs">{String(r.target_id).slice(0, 8)}</code> : null}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {r.details && Object.keys(r.details).length ? <code className="break-all">{JSON.stringify(r.details)}</code> : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
