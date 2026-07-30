import { createClient } from "@/lib/supabase/server";
import { hasMinRole, type Role } from "@/lib/permissions";
import { computeBillingInfo, ACCESS_REASON_MESSAGE } from "@/lib/billing/access";

export async function getCurrentOrg() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, org: null, role: null as Role | null, locationId: null as string | null };

  const { data } = await supabase
    .from("memberships")
    .select("role, location_id, organizations(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const org = (data as any)?.organizations ?? null;
  return {
    user,
    org,
    role: ((data as any)?.role as Role | null) ?? null,
    locationId: (data as any)?.location_id ?? null,
  };
}

// Serverseitiges Berechtigungs-Gate für Server Actions: RLS ist das
// eigentliche Sicherheitsnetz in der Datenbank, aber viele Regeln (z. B.
// "nur der Owner darf Admins verwalten") lassen sich in Postgres-Policies
// nicht sauber ausdrücken - die werden hier auf App-Ebene durchgesetzt,
// bevor überhaupt eine Query läuft.
//
// requireActive (default true) ist der zentrale Durchsetzungspunkt für P12:
// praktisch jede schreibende Server Action im Dashboard läuft durch dieses
// Gate, daher genügt EINE Stelle, um "nach Ablauf der Testphase oder bei
// unbezahlten Rechnungen eingeschränkt" für die gesamte App durchzusetzen,
// statt jede einzelne Action separat anzupassen. Lesezugriffe (Programme
// ansehen, Kundenliste, Aktivitätsprotokoll) laufen NICHT über dieses Gate
// und bleiben immer verfügbar - ein Betrieb soll seine eigenen Daten nie
// verlieren, nur weil eine Zahlung fehlgeschlagen ist. Abrechnungs-Aktionen
// selbst (Checkout, Kundenportal, Kündigung) rufen requireOrgRole mit
// { requireActive: false } auf - sonst könnte sich ein eingeschränkter
// Betrieb nicht mehr freischalten.
export async function requireOrgRole(
  min: Role,
  opts: { requireActive?: boolean } = {}
): Promise<
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getCurrentOrg>>["user"]>; org: any; role: Role; locationId: string | null }
  | { ok: false; error: string }
> {
  const { requireActive = true } = opts;
  const { user, org, role, locationId } = await getCurrentOrg();
  if (!user) return { ok: false, error: "Bitte melde dich an." };
  if (!org) return { ok: false, error: "Kein Betrieb gefunden." };
  if (!hasMinRole(role, min)) return { ok: false, error: "Dafür fehlt dir die Berechtigung." };
  if (requireActive) {
    const billing = computeBillingInfo(org);
    if (billing.state === "restricted") {
      return { ok: false, error: ACCESS_REASON_MESSAGE[billing.reason] };
    }
  }
  return { ok: true, user, org, role: role as Role, locationId };
}
