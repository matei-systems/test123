import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmtDateTime } from "@/lib/programs";
import SubmitButton from "@/components/SubmitButton";
import { markContactDone, resolveReport } from "@/app/admin/moderation-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meldungen & Kontakt" };

const REASON: Record<string, string> = {
  falsche_angaben: "Falsche Angaben",
  unangemessen: "Unangemessene Inhalte",
  betrug: "Verdacht auf Betrug",
  sonstiges: "Sonstiges",
};
const TOPIC: Record<string, string> = { kunde: "Kunde", geschaeft: "Geschäft", presse: "Presse", sonstiges: "Sonstiges" };

export default async function MeldungenPage({ searchParams }: { searchParams: { ok?: string; fehler?: string } }) {
  const db = createAdminClient();
  const [{ data: reports }, { data: messages }] = await Promise.all([
    db
      .from("content_reports")
      .select("id, reason, message, reporter_email, status, resolution_note, created_at, org_id, organizations(name)")
      .order("status", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(100),
    db.from("contact_messages").select("id, name, email, topic, message, status, created_at").order("status", { ascending: false }).order("created_at", { ascending: false }).limit(100),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-[30px] font-semibold leading-tight">Meldungen & Kontakt</h1>
        {searchParams.ok && <p role="status" className="mt-4 rounded-xl bg-forest/10 px-4 py-3 text-sm font-medium text-forest">{searchParams.ok}</p>}
        {searchParams.fehler && <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{searchParams.fehler}</p>}
      </div>

      <section aria-labelledby="reports-h">
        <h2 id="reports-h" className="font-display text-xl font-semibold">Gemeldete Geschäftsprofile</h2>
        <ul className="mt-4 space-y-3">
          {(reports ?? []).length === 0 && <li className="card p-6 text-center text-muted">Keine Meldungen.</li>}
          {(reports ?? []).map((r: any) => (
            <li key={r.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.organizations?.name ?? "Betrieb"}</span>
                <span className="badge badge-accent">{REASON[r.reason] ?? r.reason}</span>
                <span className={`badge ${r.status === "open" ? "badge-warn" : "badge-muted"}`}>{r.status === "open" ? "offen" : r.status === "resolved" ? "erledigt" : "verworfen"}</span>
                <span className="text-sm text-faint">{fmtDateTime(r.created_at)}</span>
              </div>
              {r.message && <p className="mt-2 whitespace-pre-line text-[15px]">{r.message}</p>}
              <p className="mt-1 text-sm text-muted">Gemeldet von: {r.reporter_email ?? "anonym"}</p>
              {r.resolution_note && <p className="mt-1 text-sm">Notiz: „{r.resolution_note}“</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/admin/pruefungen/${r.org_id}`} className="btn btn-ghost btn-sm">Profil prüfen</Link>
              </div>
              {r.status === "open" && (
                <form action={resolveReport} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={r.id} />
                  <label htmlFor={`rn-${r.id}`} className="sr-only">Notiz</label>
                  <input id={`rn-${r.id}`} name="note" className="input" placeholder="Notiz zur Entscheidung" maxLength={1000} />
                  <button type="submit" name="status" value="resolved" className="btn btn-dark shrink-0">Erledigt</button>
                  <button type="submit" name="status" value="dismissed" className="btn btn-ghost shrink-0">Verwerfen</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="contact-h">
        <h2 id="contact-h" className="font-display text-xl font-semibold">Kontaktanfragen</h2>
        <ul className="mt-4 space-y-3">
          {(messages ?? []).length === 0 && <li className="card p-6 text-center text-muted">Keine Anfragen.</li>}
          {(messages ?? []).map((m: any) => (
            <li key={m.id} className={`card p-5 ${m.status === "done" ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{m.name}</span>
                <a href={`mailto:${m.email}`} className="text-sm text-accent">{m.email}</a>
                <span className="badge badge-muted">{TOPIC[m.topic] ?? m.topic}</span>
                <span className="text-sm text-faint">{fmtDateTime(m.created_at)}</span>
                {m.status === "done" && <span className="badge badge-forest">erledigt</span>}
              </div>
              <p className="mt-2 whitespace-pre-line text-[15px]">{m.message}</p>
              {m.status !== "done" && (
                <form action={markContactDone} className="mt-3">
                  <input type="hidden" name="id" value={m.id} />
                  <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">Als erledigt markieren</SubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
