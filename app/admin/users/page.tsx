import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const ROLE_LABEL: Record<string, string> = { owner: "Inhaber", admin: "Admin", staff: "Mitarbeiter" };

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const db = createAdminClient();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = db
    .from("profiles")
    .select("id,email,full_name,created_at,memberships(role,organizations(id,name))", { count: "exact" });
  if (searchParams.q) query = query.ilike("email", `%${searchParams.q}%`);

  const { data: users, count } = await query.order("created_at", { ascending: false }).range(from, to);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    params.set("page", String(p));
    return `/admin/users?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Benutzer</h1>
        <p className="text-dim text-sm">{total} {total === 1 ? "registrierte Person" : "registrierte Personen"} auf der Plattform</p>
      </div>

      <form method="get" className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label">Suche</label>
          <input type="text" name="q" defaultValue={searchParams.q ?? ""} placeholder="E-Mail-Adresse…" className="input text-sm" />
        </div>
        <button className="btn btn-primary text-sm">Suchen</button>
        {searchParams.q && (
          <Link href="/admin/users" className="btn btn-ghost text-sm">
            Zurücksetzen
          </Link>
        )}
      </form>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-faint">
              <th className="p-4 font-medium">E-Mail</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Betriebe</th>
              <th className="p-4 font-medium">Registriert</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u: any) => (
              <tr key={u.id} className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02]">
                <td className="p-4 font-medium">{u.email ?? "-"}</td>
                <td className="p-4 text-dim">{u.full_name || "-"}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {(u.memberships ?? []).map((m: any, i: number) =>
                      m.organizations ? (
                        <Link
                          key={i}
                          href={`/admin/organizations/${m.organizations.id}`}
                          className="text-xs px-2 py-1 rounded-full bg-white/[0.05] text-dim hover:text-gold-bright hover:bg-white/[0.08]"
                        >
                          {m.organizations.name} · {ROLE_LABEL[m.role] ?? m.role}
                        </Link>
                      ) : null
                    )}
                    {(u.memberships ?? []).length === 0 && <span className="text-xs text-faint">Kein Betrieb</span>}
                  </div>
                </td>
                <td className="p-4 text-faint">{fmtDate(u.created_at)}</td>
              </tr>
            ))}
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-faint">
                  Keine Benutzer gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-dim">
          <span>
            Seite {page} von {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="btn btn-ghost text-sm">
                ← Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className="btn btn-ghost text-sm">
                Weiter →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
