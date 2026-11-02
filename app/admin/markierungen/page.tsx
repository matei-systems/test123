import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmtDateTime } from "@/lib/programs";
import SubmitButton from "@/components/SubmitButton";
import { resolveFlag } from "@/app/admin/moderation-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verdächtige Buchungen" };

const REASON: Record<string, { label: string; explain: (d: any) => string }> = {
  velocity_card: { label: "Viele Buchungen auf einer Karte", explain: (d) => `${d?.buchungen_24h ?? "?"} Vergaben in 24 Stunden` },
  velocity_staff: { label: "Sehr viele Buchungen eines Mitarbeiters", explain: (d) => `${d?.buchungen_10min ?? "?"} Vergaben in 10 Minuten` },
  large_amount: { label: "Ungewöhnlich große Punktebuchung", explain: (d) => `${d?.punkte ?? "?"} Punkte auf einmal` },
  velocity_redeem: { label: "Viele Einlösungen auf einer Karte", explain: (d) => `${d?.einloesungen_24h ?? "?"} Einlösungen in 24 Stunden` },
};

export default async function MarkierungenPage({ searchParams }: { searchParams: { status?: string; ok?: string; fehler?: string } }) {
  const status = searchParams.status === "done" ? "done" : "open";
  const db = createAdminClient();
  let q = db
    .from("transaction_flags")
    .select("id, reason, details, status, resolution_note, resolved_at, created_at, org_id, card_id, transaction_id, organizations(name), cards(serial_number, customers(full_name)), transactions(type, amount, note, created_at, staff_id)")
    .order("created_at", { ascending: false })
    .limit(200);
  q = status === "open" ? q.eq("status", "open") : q.neq("status", "open");
  const [{ data: flags }, { count: openCount }] = await Promise.all([q, db.from("transaction_flags").select("id", { count: "exact", head: true }).eq("status", "open")]);

  return (
    <div>
      <h1 className="font-display text-[30px] font-semibold leading-tight">Verdächtige Buchungen</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        Die Datenbank markiert automatisch auffällige Muster (z. B. 8+ Vergaben auf einer Karte in 24 h, 40+ Vergaben eines Mitarbeiters
        in 10 Minuten, 500+ Punkte auf einmal, 3+ Einlösungen in 24 h). Eine Markierung ist ein Hinweis, kein Beweis.
      </p>
      {searchParams.ok && <p role="status" className="mt-4 rounded-xl bg-forest/10 px-4 py-3 text-sm font-medium text-forest">{searchParams.ok}</p>}
      {searchParams.fehler && <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{searchParams.fehler}</p>}

      <nav className="mt-6 flex gap-2" aria-label="Filter">
        <Link href="/admin/markierungen" className="chip" aria-current={status === "open" ? "true" : undefined}>
          Offen <span className="tabular opacity-70">{openCount ?? 0}</span>
        </Link>
        <Link href="/admin/markierungen?status=done" className="chip" aria-current={status === "done" ? "true" : undefined}>
          Erledigt
        </Link>
      </nav>

      <ul className="mt-6 space-y-3">
        {(flags ?? []).length === 0 && <li className="card p-8 text-center text-muted">{status === "open" ? "Keine offenen Markierungen." : "Noch nichts erledigt."}</li>}
        {(flags ?? []).map((f: any) => {
          const r = REASON[f.reason] ?? { label: f.reason, explain: () => "" };
          return (
            <li key={f.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{r.label}</span>
                    <span className={`badge ${f.status === "open" ? "badge-warn" : f.status === "resolved" ? "badge-forest" : "badge-muted"}`}>
                      {f.status === "open" ? "offen" : f.status === "resolved" ? "geprüft" : "verworfen"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {r.explain(f.details)} · {f.organizations?.name ?? "Betrieb"} · Kunde: {f.cards?.customers?.full_name ?? "–"} · {fmtDateTime(f.created_at)}
                  </p>
                  {f.transactions && (
                    <p className="mt-1 text-sm text-faint">
                      Auslösende Buchung: {f.transactions.type} {f.transactions.amount}
                      {f.transactions.note ? ` · ${f.transactions.note}` : ""}
                    </p>
                  )}
                  {f.resolution_note && <p className="mt-1 text-sm">Notiz: „{f.resolution_note}“</p>}
                </div>
                <Link href={`/admin/organizations/${f.org_id}`} className="btn btn-ghost btn-sm">Betrieb</Link>
              </div>
              {f.status === "open" && (
                <form action={resolveFlag} className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={f.id} />
                  <label htmlFor={`n-${f.id}`} className="sr-only">Notiz</label>
                  <input id={`n-${f.id}`} name="note" className="input" placeholder="Notiz (z. B. Rücksprache gehalten, Stammkunde)" maxLength={1000} />
                  <button type="submit" name="status" value="resolved" className="btn btn-dark shrink-0">Geprüft</button>
                  <button type="submit" name="status" value="dismissed" className="btn btn-ghost shrink-0">Unbedenklich</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
