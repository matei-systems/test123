"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePlatformAdmin, logAdminAction } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

// Moderation im Admin-Panel. Jede Aktion prüft die Admin-Rolle selbst
// (zusätzlich zum Layout-Gate) und schreibt ins Audit-Log. Geschäftsprofile
// freischalten/ablehnen/pausieren und Belohnungen sperren: nur Superadmin.
// Verdachtsfälle, Meldungen und Kontaktanfragen: auch Support.

function go(path: string, msg: string, ok = true): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${ok ? "ok" : "fehler"}=${encodeURIComponent(msg)}`);
}

const TRANSITIONS: Record<string, { from: string[]; to: string; label: string; needsNote: boolean }> = {
  approved: { from: ["pending", "rejected", "draft"], to: "approved", label: "freigeschaltet", needsNote: false },
  rejected: { from: ["pending"], to: "rejected", label: "abgelehnt", needsNote: true },
  paused: { from: ["approved"], to: "paused", label: "pausiert", needsNote: true },
  unpaused: { from: ["paused"], to: "approved", label: "wieder freigeschaltet", needsNote: false },
};

export async function reviewBusiness(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "");
  const path = `/admin/pruefungen/${encodeURIComponent(orgId)}`;
  const gate = await requirePlatformAdmin("superadmin");
  if (!gate.ok) go(path, gate.error, false);

  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;
  const t = TRANSITIONS[decision];
  if (!t) go(path, "Unbekannte Entscheidung.", false);
  if (t.needsNote && !note) go(path, "Bitte gib eine Begründung an – der Betrieb sieht sie in seinem Dashboard.", false);

  const db = createAdminClient();
  const { data: profile } = await db.from("business_profiles").select("listing_status").eq("org_id", orgId).maybeSingle();
  if (!profile) go(path, "Profil nicht gefunden.", false);
  if (!t.from.includes(profile!.listing_status)) go(path, `Von „${profile!.listing_status}“ aus ist das nicht möglich.`, false);

  const update: Record<string, unknown> = { listing_status: t.to };
  if (t.to === "approved") update.approved_at = new Date().toISOString();
  const { error } = await db.from("business_profiles").update(update).eq("org_id", orgId);
  if (error) go(path, error.message, false);

  await db.from("business_reviews").insert({ org_id: orgId, decision, note, admin_id: gate.ok ? gate.admin.user_id : null });
  await logAdminAction(gate.ok ? gate.admin.user_id : "", `business_${decision}`, "organization", orgId, { note });
  revalidatePath("/admin/pruefungen");
  revalidatePath(path);
  revalidatePath("/geschaefte");
  go(path, `Profil ${t.label}.`);
}

export async function deactivateReward(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "");
  const rewardId = String(formData.get("rewardId") ?? "");
  const path = `/admin/pruefungen/${encodeURIComponent(orgId)}`;
  const gate = await requirePlatformAdmin("superadmin");
  if (!gate.ok) go(path, gate.error, false);
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;

  const db = createAdminClient();
  const { error } = await db.from("rewards").update({ active: false }).eq("id", rewardId).eq("org_id", orgId);
  if (error) go(path, error.message, false);
  await logAdminAction(gate.ok ? gate.admin.user_id : "", "reward_deactivated", "reward", rewardId, { orgId, note });
  revalidatePath(path);
  go(path, "Belohnung deaktiviert.");
}

export async function resolveFlag(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const gate = await requirePlatformAdmin("support");
  if (!gate.ok) go("/admin/markierungen", gate.error, false);
  const status = formData.get("status") === "dismissed" ? "dismissed" : "resolved";
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;

  const db = createAdminClient();
  const { error } = await db
    .from("transaction_flags")
    .update({ status, resolution_note: note, resolved_by: gate.ok ? gate.admin.user_id : null, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "open");
  if (error) go("/admin/markierungen", error.message, false);
  await logAdminAction(gate.ok ? gate.admin.user_id : "", `flag_${status}`, "transaction_flag", id, { note });
  revalidatePath("/admin/markierungen");
  go("/admin/markierungen", status === "resolved" ? "Als geprüft markiert." : "Als unbedenklich verworfen.");
}

export async function resolveReport(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const gate = await requirePlatformAdmin("support");
  if (!gate.ok) go("/admin/meldungen", gate.error, false);
  const status = formData.get("status") === "dismissed" ? "dismissed" : "resolved";
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;
  const db = createAdminClient();
  const { error } = await db
    .from("content_reports")
    .update({ status, resolution_note: note, resolved_by: gate.ok ? gate.admin.user_id : null, resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) go("/admin/meldungen", error.message, false);
  await logAdminAction(gate.ok ? gate.admin.user_id : "", `report_${status}`, "content_report", id, { note });
  revalidatePath("/admin/meldungen");
  go("/admin/meldungen", "Meldung bearbeitet.");
}

export async function markContactDone(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const gate = await requirePlatformAdmin("support");
  if (!gate.ok) go("/admin/meldungen", gate.error, false);
  const db = createAdminClient();
  const { error } = await db
    .from("contact_messages")
    .update({ status: "done", handled_by: gate.ok ? gate.admin.user_id : null, handled_at: new Date().toISOString() })
    .eq("id", id);
  if (error) go("/admin/meldungen", error.message, false);
  await logAdminAction(gate.ok ? gate.admin.user_id : "", "contact_done", "contact_message", id, {});
  revalidatePath("/admin/meldungen");
  go("/admin/meldungen", "Anfrage als erledigt markiert.");
}
