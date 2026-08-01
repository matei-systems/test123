import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import SubmitButton from "@/components/SubmitButton";
import { replyToTicket } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { open: "Offen", in_progress: "In Bearbeitung", resolved: "Gelöst", closed: "Geschlossen" };
const PRIORITY_LABEL: Record<string, string> = { low: "Niedrig", normal: "Normal", high: "Hoch", urgent: "Dringend" };

function fmtDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function AdminTicketDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const db = createAdminClient();
  const { data: ticket } = await db
    .from("support_tickets")
    .select("*, organizations(id,name)")
    .eq("id", params.id)
    .maybeSingle();
  if (!ticket) notFound();

  const { data: messages } = await db
    .from("support_ticket_messages")
    .select("id,body,is_admin,author_id,created_at,profiles(email,full_name)")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-3xl">
      <Link href="/admin/support" className="text-xs text-faint hover:text-gold-bright">
        ← Alle Support-Fälle
      </Link>
      <div className="mb-6 mt-1">
        <h1 className="text-2xl font-bold tracking-tight mb-1">{ticket.subject}</h1>
        <p className="text-dim text-sm">
          {ticket.organizations && (
            <Link href={`/admin/organizations/${ticket.organizations.id}`} className="text-gold hover:text-gold-bright">
              {ticket.organizations.name}
            </Link>
          )}
          {" · "}
          {STATUS_LABEL[ticket.status] ?? ticket.status} · {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
        </p>
      </div>

      {searchParams?.error && (
        <div className="mb-5 text-sm rounded-lg px-3 py-2.5" style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
          {searchParams.error}
        </div>
      )}

      <div className="space-y-3 mb-6">
        {(messages ?? []).map((m: any) => (
          <div
            key={m.id}
            className="card p-4"
            style={m.is_admin ? { background: "rgba(232,181,115,0.06)", borderColor: "rgba(232,181,115,0.2)" } : undefined}
          >
            <div className="flex items-center justify-between mb-1.5 text-xs text-faint">
              <span className="font-semibold" style={{ color: m.is_admin ? "#E8B573" : "#F4F1EC" }}>
                {m.is_admin ? "Support-Team" : m.profiles?.full_name || m.profiles?.email || "Betrieb"}
              </span>
              <span>{fmtDateTime(m.created_at)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
        {(messages ?? []).length === 0 && <p className="text-sm text-faint">Noch keine Nachrichten.</p>}
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-bold tracking-tight mb-3">Antworten &amp; Status ändern</h2>
        <form action={replyToTicket} className="space-y-3">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <textarea name="body" rows={4} className="input text-sm" placeholder="Antwort an den Betrieb…" />
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="label">Status</label>
              <select name="status" defaultValue={ticket.status} className="input text-sm">
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priorität</label>
              <select name="priority" defaultValue={ticket.priority} className="input text-sm">
                {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <SubmitButton pendingText="Wird gespeichert…" className="btn btn-primary text-sm">
              Speichern
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
