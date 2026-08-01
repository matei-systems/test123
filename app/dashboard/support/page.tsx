import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/SubmitButton";
import { createTicket } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { open: "Offen", in_progress: "In Bearbeitung", resolved: "Gelöst", closed: "Geschlossen" };
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  open: { bg: "rgba(232,181,115,0.14)", fg: "#E8B573" },
  in_progress: { bg: "rgba(96,165,250,0.14)", fg: "#93C5FD" },
  resolved: { bg: "rgba(74,222,128,0.12)", fg: "#86EFAC" },
  closed: { bg: "rgba(148,148,148,0.14)", fg: "#C9C4BC" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function SupportPage({ searchParams }: { searchParams: { error?: string } }) {
  const { org } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  const supabase = createClient();
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id,subject,status,priority,created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Support</h1>
        <p className="text-dim text-sm">Fragen oder Probleme? Wir helfen dir gerne weiter.</p>
      </div>

      {searchParams?.error && (
        <div className="mb-5 text-sm rounded-lg px-3 py-2.5" style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
          {searchParams.error}
        </div>
      )}

      <details className="card p-5 mb-6">
        <summary className="text-sm font-semibold cursor-pointer">Neuen Support-Fall erstellen</summary>
        <form action={createTicket} className="mt-4 space-y-3">
          <div>
            <label className="label">Betreff</label>
            <input type="text" name="subject" required className="input text-sm" placeholder="Worum geht's?" />
          </div>
          <div>
            <label className="label">Nachricht</label>
            <textarea name="body" required rows={4} className="input text-sm" placeholder="Beschreibe dein Anliegen…" />
          </div>
          <SubmitButton pendingText="Wird gesendet…" className="btn btn-primary text-sm">
            Fall erstellen
          </SubmitButton>
        </form>
      </details>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {(tickets ?? []).map((t: any) => {
              const color = STATUS_COLOR[t.status] ?? STATUS_COLOR.open;
              return (
                <tr key={t.id} className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02]">
                  <td className="p-4">
                    <Link href={`/dashboard/support/${t.id}`} className="font-medium text-gold hover:text-gold-bright">
                      {t.subject}
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: color.bg, color: color.fg }}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="p-4 text-faint">{fmtDate(t.created_at)}</td>
                </tr>
              );
            })}
            {(tickets ?? []).length === 0 && (
              <tr>
                <td className="p-8 text-center text-faint">Noch keine Support-Fälle.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
