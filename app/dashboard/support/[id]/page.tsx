import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/SubmitButton";
import { replyToTicket } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { open: "Offen", in_progress: "In Bearbeitung", resolved: "Gelöst", closed: "Geschlossen" };

function fmtDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const { org } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  const supabase = createClient();
  // RLS (tickets_select: is_org_member) sorgt zusätzlich dafür, dass hier
  // wirklich nur der eigene Fall sichtbar ist - die org_id-Prüfung ist eine
  // zweite, klientenseitige Absicherung für einen sauberen 404 statt eines
  // rohen "leer"-Zustands.
  const { data: ticket } = await supabase.from("support_tickets").select("*").eq("id", params.id).maybeSingle();
  if (!ticket || ticket.org_id !== org.id) notFound();

  const { data: messages } = await supabase
    .from("support_ticket_messages")
    .select("id,body,is_admin,created_at,profiles(email,full_name)")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/support" className="text-xs text-faint hover:text-gold-bright">
        ← Alle Support-Fälle
      </Link>
      <div className="mb-6 mt-1">
        <h1 className="text-2xl font-bold tracking-tight mb-1">{ticket.subject}</h1>
        <p className="text-dim text-sm">{STATUS_LABEL[ticket.status] ?? ticket.status}</p>
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
                {m.is_admin ? "Matei Loyalty Support" : m.profiles?.full_name || m.profiles?.email || "Du"}
              </span>
              <span>{fmtDateTime(m.created_at)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>

      {ticket.status !== "closed" && (
        <div className="card p-5">
          <h2 className="text-sm font-bold tracking-tight mb-3">Antworten</h2>
          <form action={replyToTicket} className="space-y-3">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <textarea name="body" required rows={4} className="input text-sm" placeholder="Deine Nachricht…" />
            <SubmitButton pendingText="Wird gesendet…" className="btn btn-primary text-sm">
              Senden
            </SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
