"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/org";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateDbError } from "@/lib/db-errors";
import { sendInvitationEmail, isEmailConfigured } from "@/lib/email";
import { ROLE_LABEL, type Role } from "@/lib/permissions";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export interface InviteResult {
  error?: string;
  acceptUrl?: string;
  emailed?: boolean;
}

// Lädt eine Person per E-Mail ins Team ein. Funktioniert immer über den
// kopierbaren Link (acceptUrl) - der E-Mail-Versand via Resend ist optional
// und nur ein Zusatz, falls RESEND_API_KEY/EMAIL_FROM gesetzt sind.
export async function inviteMember(emailRaw: string, role: Role): Promise<InviteResult> {
  const gate = await requireOrgRole("admin");
  if (!gate.ok) return { error: gate.error };
  const { org, user, role: actorRole } = gate;

  const email = emailRaw.trim().toLowerCase();
  if (!isValidEmail(email)) return { error: "Bitte gib eine gültige E-Mail-Adresse an." };
  if (role === "owner") return { error: "Ein Inhaber kann nicht eingeladen werden." };
  if (role === "admin" && actorRole !== "owner") return { error: "Nur der Inhaber kann Admins einladen." };

  const admin = createAdminClient();

  const { data: existingProfile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existingProfile) {
    const { data: existingMembership } = await admin
      .from("memberships")
      .select("id")
      .eq("org_id", org.id)
      .eq("user_id", existingProfile.id)
      .maybeSingle();
    if (existingMembership) return { error: "Diese Person ist bereits Mitglied deines Teams." };
  }

  const { data: existingInvite } = await admin
    .from("invitations")
    .select("id")
    .eq("org_id", org.id)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  if (existingInvite) {
    const { error } = await admin
      .from("invitations")
      .update({ role, token, expires_at: expiresAt, invited_by: user.id })
      .eq("id", existingInvite.id);
    if (error) return { error: translateDbError(error.message) };
  } else {
    const { error } = await admin
      .from("invitations")
      .insert({ org_id: org.id, email, role, token, invited_by: user.id, expires_at: expiresAt });
    if (error) return { error: translateDbError(error.message) };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const acceptUrl = `${appUrl}/invite/${token}`;

  let emailed = false;
  if (isEmailConfigured()) {
    const res = await sendInvitationEmail({ to: email, orgName: org.name, role: ROLE_LABEL[role], acceptUrl });
    emailed = res.ok;
  }

  revalidatePath("/dashboard/team");
  return { acceptUrl, emailed };
}

export async function revokeInvitation(id: string): Promise<{ error?: string }> {
  const gate = await requireOrgRole("admin");
  if (!gate.ok) return { error: gate.error };

  const admin = createAdminClient();
  const { error } = await admin.from("invitations").update({ status: "revoked" }).eq("id", id).eq("org_id", gate.org.id);
  if (error) return { error: translateDbError(error.message) };
  revalidatePath("/dashboard/team");
  return {};
}

// Rollenänderungen sind bewusst dem Inhaber vorbehalten - Admin-Rechte zu
// vergeben ist ein sensibler Vorgang, der nicht an Admins selbst delegiert wird.
export async function updateMemberRole(membershipId: string, newRole: Role): Promise<{ error?: string }> {
  const gate = await requireOrgRole("owner");
  if (!gate.ok) return { error: gate.error };
  if (newRole === "owner") return { error: "Die Inhaberschaft kann hier nicht übertragen werden." };

  const admin = createAdminClient();
  const { data: target } = await admin.from("memberships").select("role, org_id").eq("id", membershipId).maybeSingle();
  if (!target || target.org_id !== gate.org.id) return { error: "Mitglied nicht gefunden." };
  if (target.role === "owner") return { error: "Der Inhaber kann nicht geändert werden." };

  const { error } = await admin.from("memberships").update({ role: newRole }).eq("id", membershipId);
  if (error) return { error: translateDbError(error.message) };
  revalidatePath("/dashboard/team");
  return {};
}

export async function removeMember(membershipId: string): Promise<{ error?: string }> {
  const gate = await requireOrgRole("admin");
  if (!gate.ok) return { error: gate.error };

  const admin = createAdminClient();
  const { data: target } = await admin.from("memberships").select("role, org_id").eq("id", membershipId).maybeSingle();
  if (!target || target.org_id !== gate.org.id) return { error: "Mitglied nicht gefunden." };
  if (target.role === "owner") return { error: "Der Inhaber kann nicht entfernt werden." };
  if (target.role === "admin" && gate.role !== "owner") return { error: "Nur der Inhaber kann Admins entfernen." };

  const { error } = await admin.from("memberships").delete().eq("id", membershipId);
  if (error) return { error: translateDbError(error.message) };
  revalidatePath("/dashboard/team");
  return {};
}

// Ordnet eine Person optional einem Standort zu (bereitet Mehr-Filial-Betriebe
// vor) - Transaktionen dieser Person werden künftig automatisch damit getaggt.
export async function assignMemberLocation(membershipId: string, locationId: string | null): Promise<{ error?: string }> {
  const gate = await requireOrgRole("admin");
  if (!gate.ok) return { error: gate.error };

  const admin = createAdminClient();
  const { data: target } = await admin.from("memberships").select("org_id").eq("id", membershipId).maybeSingle();
  if (!target || target.org_id !== gate.org.id) return { error: "Mitglied nicht gefunden." };

  if (locationId) {
    const { data: loc } = await admin.from("locations").select("id").eq("id", locationId).eq("org_id", gate.org.id).maybeSingle();
    if (!loc) return { error: "Standort nicht gefunden." };
  }

  const { error } = await admin.from("memberships").update({ location_id: locationId }).eq("id", membershipId);
  if (error) return { error: translateDbError(error.message) };
  revalidatePath("/dashboard/team");
  return {};
}
