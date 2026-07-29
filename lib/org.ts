import { createClient } from "@/lib/supabase/server";
import { hasMinRole, type Role } from "@/lib/permissions";

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
export async function requireOrgRole(
  min: Role
): Promise<
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getCurrentOrg>>["user"]>; org: any; role: Role; locationId: string | null }
  | { ok: false; error: string }
> {
  const { user, org, role, locationId } = await getCurrentOrg();
  if (!user) return { ok: false, error: "Bitte melde dich an." };
  if (!org) return { ok: false, error: "Kein Betrieb gefunden." };
  if (!hasMinRole(role, min)) return { ok: false, error: "Dafür fehlt dir die Berechtigung." };
  return { ok: true, user, org, role: role as Role, locationId };
}
