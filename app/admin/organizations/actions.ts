"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin, logAdminAction } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

// Alle drei Aktionen sind Superadmin-only - eine manuelle Plattform-Sperre
// oder eine kostenlose Testphasen-Verlängerung ist eine folgenreiche
// Entscheidung, die dem Support-Tier (kann nur Tickets bearbeiten) bewusst
// nicht zusteht (siehe lib/admin.ts AdminRole-Rangfolge).
//
// Geben bewusst { error? } zurück statt redirect() zu nutzen: die
// aufrufende Seite ist bereits die Zielseite (der Admin sperrt/verlängert
// einen Betrieb, den er sich gerade ansieht) - ein redirect() auf exakt
// dieselbe dynamische Route hat sich im Test als unzuverlässig erwiesen.
// ServerActionForm (Client-Komponente) ruft diese Funktionen direkt auf und
// erzwingt danach ein router.refresh(); revalidatePath() ist hier trotzdem
// Pflicht (nicht optional) - ohne sie meldet Next.js der Server Action
// keinen invalidierten Pfad (sichtbar am Response-Header
// "x-action-revalidated"), wodurch der Client die alte, bereits gerenderte
// Seite weiterzeigt, obwohl router.refresh() eine frische Anfrage auslöst.
export async function suspendOrg(formData: FormData): Promise<{ error?: string }> {
  const gate = await requirePlatformAdmin("superadmin");
  if (!gate.ok) return { error: gate.error };

  const orgId = String(formData.get("orgId"));
  const reason = String(formData.get("reason") ?? "").trim();
  const db = createAdminClient();
  const { error } = await db
    .from("organizations")
    .update({ admin_suspended: true, admin_suspended_reason: reason || null })
    .eq("id", orgId);
  if (error) return { error: error.message };

  await logAdminAction(gate.admin.user_id, "suspend_org", "organization", orgId, { reason });
  revalidatePath(`/admin/organizations/${orgId}`);
  return {};
}

export async function reactivateOrg(formData: FormData): Promise<{ error?: string }> {
  const gate = await requirePlatformAdmin("superadmin");
  if (!gate.ok) return { error: gate.error };

  const orgId = String(formData.get("orgId"));
  const db = createAdminClient();
  const { error } = await db
    .from("organizations")
    .update({ admin_suspended: false, admin_suspended_reason: null })
    .eq("id", orgId);
  if (error) return { error: error.message };

  await logAdminAction(gate.admin.user_id, "reactivate_org", "organization", orgId, {});
  revalidatePath(`/admin/organizations/${orgId}`);
  return {};
}

export async function extendTrial(formData: FormData): Promise<{ error?: string }> {
  const gate = await requirePlatformAdmin("superadmin");
  if (!gate.ok) return { error: gate.error };

  const orgId = String(formData.get("orgId"));
  const days = parseInt(String(formData.get("days") ?? "0"), 10);
  if (!Number.isFinite(days) || days <= 0) return { error: "Ungültige Anzahl Tage." };

  const db = createAdminClient();
  const { data: org, error: fetchErr } = await db
    .from("organizations")
    .select("trial_ends_at")
    .eq("id", orgId)
    .maybeSingle();
  if (fetchErr || !org) return { error: "Betrieb nicht gefunden." };

  // Bereits verbleibende Tage bleiben erhalten (Basis ist das spätere von
  // "jetzt" und dem bisherigen Ablaufdatum) - eine Verlängerung soll nie
  // versehentlich eine noch laufende Testphase verkürzen.
  const currentEnd = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const base = currentEnd && currentEnd.getTime() > Date.now() ? currentEnd : new Date();
  const newEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  const { error } = await db.from("organizations").update({ trial_ends_at: newEnd.toISOString() }).eq("id", orgId);
  if (error) return { error: error.message };

  await logAdminAction(gate.admin.user_id, "extend_trial", "organization", orgId, { days, newEnd: newEnd.toISOString() });
  revalidatePath(`/admin/organizations/${orgId}`);
  return {};
}
