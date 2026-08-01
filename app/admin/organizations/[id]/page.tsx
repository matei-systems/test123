import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/admin";
import { computeBillingInfo, ACCESS_REASON_MESSAGE } from "@/lib/billing/access";
import { getPlan } from "@/lib/billing/plans";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import ServerActionForm from "@/components/admin/ServerActionForm";
import SuspendControl from "@/components/admin/SuspendControl";
import { suspendOrg, reactivateOrg, extendTrial } from "../actions";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { owner: "Inhaber", admin: "Admin", staff: "Mitarbeiter" };
const TICKET_STATUS_LABEL: Record<string, string> = { open: "Offen", in_progress: "In Bearbeitung", resolved: "Gelöst", closed: "Geschlossen" };

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function AdminOrgDetailPage({ params }: { params: { id: string } }) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) notFound();
  const isSuperadmin = gate.admin.role === "superadmin";

  const db = createAdminClient();
  const { data: org } = await db.from("organizations").select("*").eq("id", params.id).maybeSingle();
  if (!org) notFound();

  const [{ data: owner }, { data: memberships }, { data: programs, count: programCount }, { data: customers, count: customerCount }, { data: cards, count: cardCount }, { data: tickets }, { data: auditLog }] =
    await Promise.all([
      db.from("profiles").select("id,email,full_name").eq("id", org.owner_id).maybeSingle(),
      db.from("memberships").select("id,role,user_id,profiles(email,full_name)").eq("org_id", org.id).order("role"),
      db.from("loyalty_programs").select("id", { count: "exact", head: true }).eq("org_id", org.id),
      db.from("customers").select("id", { count: "exact", head: true }).eq("org_id", org.id),
      db.from("cards").select("id", { count: "exact", head: true }).eq("org_id", org.id),
      db.from("support_tickets").select("id,subject,status,priority,created_at").eq("org_id", org.id).order("created_at", { ascending: false }).limit(10),
      db
        .from("admin_audit_log")
        .select("id,admin_id,action,details,created_at")
        .eq("target_type", "organization")
        .eq("target_id", org.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const adminIds = Array.from(new Set((auditLog ?? []).map((a: any) => a.admin_id)));
  const adminMap = new Map<string, string>();
  if (adminIds.length > 0) {
    const { data: adminProfiles } = await db.from("profiles").select("id,email").in("id", adminIds);
    (adminProfiles ?? []).forEach((p: any) => adminMap.set(p.id, p.email ?? p.id));
  }

  const billing = computeBillingInfo(org);
  const stripeConfigured = isStripeConfigured();

  let invoices: { id: string; date: Date; amount: string; status: string; url: string | null }[] = [];
  if (stripeConfigured && org.stripe_customer_id) {
    try {
      const list = await getStripe().invoices.list({ customer: org.stripe_customer_id, limit: 10 });
      invoices = list.data.map((inv) => ({
        id: inv.id ?? inv.number ?? "",
        date: new Date((inv.created ?? 0) * 1000),
        amount: `${((inv.amount_paid ?? inv.total ?? 0) / 100).toFixed(2)}€`,
        status: inv.status ?? "unknown",
        url: inv.hosted_invoice_url ?? null,
      }));
    } catch (e: any) {
      console.error("[admin/org-detail] Rechnungen konnten nicht geladen werden:", e.message);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/organizations" className="text-xs text-faint hover:text-gold-bright">
          ← Alle Unternehmen
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-1 mb-1">{org.name}</h1>
        <p className="text-dim text-sm">
          /{org.slug} · Angelegt am {fmtDate(org.created_at)} · Inhaber: {owner?.full_name || owner?.email || org.owner_id}
        </p>
      </div>

      <SuspendControl
        orgId={org.id}
        initialSuspended={org.admin_suspended}
        initialReason={org.admin_suspended_reason}
        isSuperadmin={isSuperadmin}
        suspendAction={suspendOrg}
        reactivateAction={reactivateOrg}
      />

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="text-sm font-bold tracking-tight mb-3">Abrechnung</h2>
          <div className="text-sm space-y-1.5 text-dim">
            <div>Tarif: <span className="text-[#F4F1EC] font-medium">{billing.plan?.name ?? "Kein Tarif"}</span>{billing.interval && ` (${billing.interval === "monthly" ? "monatlich" : "jährlich"})`}</div>
            <div>Status: <span className="text-[#F4F1EC] font-medium">{billing.subscriptionStatus ?? "kein Stripe-Abo"}</span></div>
            <div>Zugriff: <span className={billing.state === "active" ? "text-[#86EFAC]" : "text-[#FCA5A5]"}>{billing.state === "active" ? "Aktiv" : "Eingeschränkt"}</span> - {ACCESS_REASON_MESSAGE[billing.reason]}</div>
            {billing.trialEndsAt && <div>Testphase endet: {fmtDate(billing.trialEndsAt.toISOString())}</div>}
            {billing.currentPeriodEnd && <div>{billing.cancelAtPeriodEnd ? "Endet am" : "Nächste Abrechnung"}: {fmtDate(billing.currentPeriodEnd.toISOString())}</div>}
            {org.stripe_customer_id && <div className="text-xs text-faint">Stripe-Kunde: {org.stripe_customer_id}</div>}
          </div>
          {isSuperadmin && (
            <ServerActionForm
              action={extendTrial}
              className="mt-4 flex items-end gap-2 flex-wrap"
              submitLabel="Verlängern"
              pendingLabel="…"
              submitClassName="btn btn-ghost text-sm"
            >
              <input type="hidden" name="orgId" value={org.id} />
              <div>
                <label className="label">Testphase verlängern (Tage)</label>
                <input type="number" name="days" min={1} defaultValue={14} className="input text-sm w-28" />
              </div>
            </ServerActionForm>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-bold tracking-tight mb-3">Nutzung</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-extrabold">{programCount ?? 0}</div>
              <div className="text-xs text-faint">Programme</div>
            </div>
            <div>
              <div className="text-xl font-extrabold">{customerCount ?? 0}</div>
              <div className="text-xs text-faint">Kund:innen</div>
            </div>
            <div>
              <div className="text-xl font-extrabold">{cardCount ?? 0}</div>
              <div className="text-xs text-faint">Karten</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-bold tracking-tight mb-3">Mitglieder</h2>
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {(memberships ?? []).map((m: any) => (
                <tr key={m.id} className="border-b border-white/[0.06] last:border-b-0">
                  <td className="p-4">{m.profiles?.full_name || m.profiles?.email || m.user_id}</td>
                  <td className="p-4 text-dim">{m.profiles?.email}</td>
                  <td className="p-4 text-faint">{ROLE_LABEL[m.role] ?? m.role}</td>
                </tr>
              ))}
              {(memberships ?? []).length === 0 && (
                <tr><td className="p-4 text-faint">Keine Mitglieder.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-sm font-bold tracking-tight mb-3">Rechnungen</h2>
          <div className="card overflow-hidden">
            {invoices.length === 0 ? (
              <div className="p-4 text-sm text-faint">Keine Rechnungen.</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-white/[0.06] last:border-b-0">
                      <td className="p-3 text-faint">{fmtDate(inv.date.toISOString())}</td>
                      <td className="p-3 font-medium">{inv.amount}</td>
                      <td className="p-3 text-faint capitalize">{inv.status}</td>
                      <td className="p-3 text-right">
                        {inv.url && (
                          <a href={inv.url} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-bright">
                            Ansehen ↗
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold tracking-tight mb-3">Support-Fälle</h2>
          <div className="card overflow-hidden">
            {(tickets ?? []).length === 0 ? (
              <div className="p-4 text-sm text-faint">Keine Support-Fälle.</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {(tickets ?? []).map((t: any) => (
                    <tr key={t.id} className="border-b border-white/[0.06] last:border-b-0">
                      <td className="p-3">
                        <Link href={`/admin/support/${t.id}`} className="text-gold hover:text-gold-bright">
                          {t.subject}
                        </Link>
                      </td>
                      <td className="p-3 text-faint">{TICKET_STATUS_LABEL[t.status] ?? t.status}</td>
                      <td className="p-3 text-faint">{fmtDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold tracking-tight mb-3">Admin-Verlauf</h2>
        <div className="card overflow-hidden">
          {(auditLog ?? []).length === 0 ? (
            <div className="p-4 text-sm text-faint">Noch keine Admin-Aktionen protokolliert.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {(auditLog ?? []).map((a: any) => (
                  <tr key={a.id} className="border-b border-white/[0.06] last:border-b-0">
                    <td className="p-3 font-medium">{a.action}</td>
                    <td className="p-3 text-faint">{adminMap.get(a.admin_id) ?? a.admin_id}</td>
                    <td className="p-3 text-faint">{fmtDateTime(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
