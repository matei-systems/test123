// Manuelle Plattform-Sperre (P14, Admin-Panel) - unabhängig vom
// Abrechnungsstatus, siehe lib/org.ts requireOrgRole(). Bewusst deutlich
// dringlicher gestaltet als die reguläre BillingBanner-Einschränkung, damit
// klar wird: hier hilft kein Tarifwechsel, sondern nur der Support.
export default function SuspendedBanner({ reason }: { reason: string | null }) {
  return (
    <div className="mb-5 text-sm rounded-lg px-4 py-3" style={{ background: "rgba(239,68,68,0.16)", border: "1px solid rgba(239,68,68,0.35)", color: "#FCA5A5" }}>
      <div className="font-semibold mb-0.5">Dieser Betrieb wurde von der Plattform gesperrt.</div>
      <div>{reason || "Bitte kontaktiere den Support, um die Sperre klären zu lassen."}</div>
    </div>
  );
}
