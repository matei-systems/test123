import Link from "next/link";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const STATUS_LABEL: Record<string, string> = {
  draft: "Entwurf",
  open: "Offen",
  paid: "Bezahlt",
  uncollectible: "Uneinbringlich",
  void: "Storniert",
};
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  paid: { bg: "rgba(74,222,128,0.12)", fg: "#86EFAC" },
  open: { bg: "rgba(232,181,115,0.14)", fg: "#E8B573" },
  uncollectible: { bg: "rgba(239,68,68,0.12)", fg: "#FCA5A5" },
  void: { bg: "rgba(148,148,148,0.14)", fg: "#C9C4BC" },
  draft: { bg: "rgba(148,148,148,0.14)", fg: "#C9C4BC" },
};

function fmtDate(unix: number | null): string {
  if (!unix) return "-";
  return new Date(unix * 1000).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Rechnungen werden bewusst live von der Stripe-API gelesen (wie schon auf
// der Betriebs-eigenen Abrechnungsseite, app/dashboard/billing/page.tsx) und
// NIE in einer eigenen Tabelle gespiegelt - Stripe bleibt die einzige
// Quelle der Wahrheit für Finanzdaten. Stripes eigene Cursor-Pagination
// (starting_after/has_more) skaliert dabei unabhängig davon, wie viele
// Rechnungen die Plattform insgesamt hat.
export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: { status?: string; c?: string };
}) {
  const stripeConfigured = isStripeConfigured();

  if (!stripeConfigured) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Rechnungen</h1>
        <p className="text-dim text-sm mb-6">Alle Rechnungen aus Stripe, plattformweit</p>
        <div className="card p-5 text-sm" style={{ background: "rgba(232,181,115,0.08)", color: "#E8B573" }}>
          Zahlungen sind noch nicht eingerichtet - Rechnungen erscheinen hier automatisch, sobald ein Stripe-Konto hinterlegt ist.
        </div>
      </div>
    );
  }

  const cursorStack = (searchParams.c ?? "").split(",").filter(Boolean);
  const startingAfter = cursorStack.length > 0 ? cursorStack[cursorStack.length - 1] : undefined;

  const list = await getStripe().invoices.list({
    limit: PAGE_SIZE,
    starting_after: startingAfter,
    ...(searchParams.status ? { status: searchParams.status as any } : {}),
  });

  const customerIds = Array.from(
    new Set(list.data.map((inv) => (typeof inv.customer === "string" ? inv.customer : inv.customer?.id)).filter(Boolean))
  ) as string[];
  const orgByCustomer = new Map<string, string>();
  if (customerIds.length > 0) {
    const db = createAdminClient();
    const { data: orgs } = await db.from("organizations").select("id,name,stripe_customer_id").in("stripe_customer_id", customerIds);
    (orgs ?? []).forEach((o: any) => orgByCustomer.set(o.stripe_customer_id, o.name));
  }

  function hrefWithCursor(stack: string[]): string {
    const params = new URLSearchParams();
    if (searchParams.status) params.set("status", searchParams.status);
    if (stack.length > 0) params.set("c", stack.join(","));
    return `/admin/invoices?${params.toString()}`;
  }

  const nextStack = [...cursorStack, list.data[list.data.length - 1]?.id].filter(Boolean) as string[];
  const prevStack = cursorStack.slice(0, -1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Rechnungen</h1>
        <p className="text-dim text-sm">Alle Rechnungen aus Stripe, plattformweit</p>
      </div>

      <form method="get" className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Status</label>
          <select name="status" defaultValue={searchParams.status ?? ""} className="input text-sm">
            <option value="">Alle</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary text-sm">Filtern</button>
        {searchParams.status && (
          <Link href="/admin/invoices" className="btn btn-ghost text-sm">Zurücksetzen</Link>
        )}
      </form>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-faint">
              <th className="p-4 font-medium">Betrieb</th>
              <th className="p-4 font-medium">Datum</th>
              <th className="p-4 font-medium">Betrag</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((inv) => {
              const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
              const orgName = customerId ? orgByCustomer.get(customerId) : null;
              const color = STATUS_COLOR[inv.status ?? ""] ?? STATUS_COLOR.draft;
              return (
                <tr key={inv.id} className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02]">
                  <td className="p-4 font-medium">{orgName ?? "Unbekannter Betrieb"}</td>
                  <td className="p-4 text-faint">{fmtDate(inv.created)}</td>
                  <td className="p-4 text-dim">{((inv.amount_paid ?? inv.total ?? 0) / 100).toFixed(2)}€</td>
                  <td className="p-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: color.bg, color: color.fg }}>
                      {STATUS_LABEL[inv.status ?? ""] ?? inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {inv.hosted_invoice_url && (
                      <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-bright">
                        Ansehen ↗
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
            {list.data.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-faint">Keine Rechnungen gefunden.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        {cursorStack.length > 0 && (
          <Link href={hrefWithCursor(prevStack)} className="btn btn-ghost text-sm">← Zurück</Link>
        )}
        {list.has_more && (
          <Link href={hrefWithCursor(nextStack)} className="btn btn-ghost text-sm">Weiter →</Link>
        )}
      </div>
    </div>
  );
}
