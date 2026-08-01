import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

export type AdminRole = "superadmin" | "support";

const ADMIN_RANK: Record<AdminRole, number> = { support: 0, superadmin: 1 };

export interface PlatformAdmin {
  id: string;
  user_id: string;
  role: AdminRole;
  created_at: string;
}

// Bewusst über den Service-Role-Client statt einer RLS-Policy mit
// "is_platform_admin()" auf platform_admins selbst - siehe Kommentar in
// supabase/schema.sql (P14-Abschnitt): ein einziger, klar auditierbarer
// Durchsetzungspunkt statt verteilter Sonderfälle.
export async function getCurrentAdmin(): Promise<{ user: any; admin: PlatformAdmin | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, admin: null };

  const db = createAdminClient();
  const { data } = await db.from("platform_admins").select("*").eq("user_id", user.id).maybeSingle();
  return { user, admin: (data as PlatformAdmin | null) ?? null };
}

// Server-seitiges Gate für das gesamte /admin-Panel - selbes Muster wie
// lib/org.ts requireOrgRole(), nur gegen platform_admins statt memberships.
export async function requirePlatformAdmin(
  min: AdminRole = "support"
): Promise<
  | { ok: true; user: any; admin: PlatformAdmin }
  | { ok: false; error: string }
> {
  const { user, admin } = await getCurrentAdmin();
  if (!user) return { ok: false, error: "Bitte melde dich an." };
  if (!admin) return { ok: false, error: "Kein Zugriff auf das Admin-Panel." };
  if (ADMIN_RANK[admin.role] < ADMIN_RANK[min]) {
    return { ok: false, error: "Dafür fehlt dir die Berechtigung (Superadmin erforderlich)." };
  }
  return { ok: true, user, admin };
}

// Schreibt einen Eintrag ins Audit-Log. Bewusst "fire-and-forget"-fest
// (await, aber Fehler werden nur geloggt, nie geworfen) - ein Logging-Fehler
// darf niemals eine echte Admin-Aktion (z. B. eine Sperrung) verhindern.
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown> = {}
): Promise<void> {
  const db = createAdminClient();
  const { error } = await db
    .from("admin_audit_log")
    .insert({ admin_id: adminId, action, target_type: targetType, target_id: targetId, details });
  if (error) logError("admin.audit-log", error, { action, targetType, targetId });
}
