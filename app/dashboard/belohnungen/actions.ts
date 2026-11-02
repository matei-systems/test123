"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrgRole } from "@/lib/org";
import { ledgerError } from "@/lib/ledger";
import { viennaDateToIso } from "@/lib/vienna-time";

// Belohnungen verwalten - nur Inhaber/Admin (zusätzlich per RLS
// rewards_insert/update/delete = is_org_admin durchgesetzt). Einlösungen
// prüft ausschließlich die Datenbank; hier geht es nur um den Katalog.

function back(msg: string, ok = false): never {
  redirect(`/dashboard/belohnungen?${ok ? "ok" : "fehler"}=` + encodeURIComponent(msg));
}

async function gate() {
  const g = await requireOrgRole("admin", { requireActive: false });
  if (!g.ok) back(g.error);
  return g;
}

function readFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const description = String(formData.get("description") ?? "").trim().slice(0, 300) || null;
  const conditions = String(formData.get("conditions") ?? "").trim().slice(0, 300) || null;
  const cost = Number(formData.get("cost_points"));
  const validFrom = viennaDateToIso(String(formData.get("valid_from") ?? ""), false);
  const validUntil = viennaDateToIso(String(formData.get("valid_until") ?? ""), true);
  if (validFrom && validUntil && validUntil <= validFrom) back("„Gültig bis“ muss nach „Gültig ab“ liegen.");
  return { title, description, conditions, cost, validFrom, validUntil };
}

async function loadProgram(programId: string, orgId: string) {
  const { data } = await createClient()
    .from("loyalty_programs")
    .select("id, type, stamps_required")
    .eq("id", programId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!data) back("Dieses Programm gehört nicht zu deinem Betrieb.");
  return data!;
}

function validateCost(cost: number, program: { type: string; stamps_required: number }) {
  if (!Number.isInteger(cost) || cost < 1 || cost > 100000) back("Die Kosten müssen eine ganze Zahl ab 1 sein.");
  // Stempel werden beim Sammeln auf die Kartengröße gedeckelt - eine teurere
  // Belohnung wäre nie erreichbar.
  if (program.type === "stamp" && cost > program.stamps_required) {
    back(`Eine Stempelkarte hat ${program.stamps_required} Felder – die Belohnung darf höchstens ${program.stamps_required} Stempel kosten.`);
  }
}

export async function createReward(formData: FormData) {
  const g = await gate();
  const program = await loadProgram(String(formData.get("program_id") ?? ""), g.org.id);
  const f = readFields(formData);
  if (f.title.length < 2) back("Bitte gib der Belohnung einen Namen.");
  validateCost(f.cost, program);

  const { error } = await createClient()
    .from("rewards")
    .insert({
      org_id: g.org.id,
      program_id: program.id,
      title: f.title,
      description: f.description,
      conditions: f.conditions,
      cost_points: f.cost,
      valid_from: f.validFrom,
      valid_until: f.validUntil,
      active: true,
    });
  if (error) back(ledgerError(error.message));
  revalidatePath("/dashboard/belohnungen");
  back(`Belohnung „${f.title}“ angelegt.`, true);
}

export async function updateReward(formData: FormData) {
  const g = await gate();
  const id = String(formData.get("id") ?? "");
  const supabase = createClient();
  const { data: reward } = await supabase.from("rewards").select("id, program_id, is_default").eq("id", id).eq("org_id", g.org.id).maybeSingle();
  if (!reward) back("Belohnung nicht gefunden.");
  const program = await loadProgram(reward!.program_id, g.org.id);
  const f = readFields(formData);

  const update: Record<string, unknown> = {
    description: f.description,
    conditions: f.conditions,
    valid_from: f.validFrom,
    valid_until: f.validUntil,
  };
  if (!reward!.is_default) {
    if (f.title.length < 2) back("Bitte gib der Belohnung einen Namen.");
    validateCost(f.cost, program);
    update.title = f.title;
    update.cost_points = f.cost;
  }
  const { error } = await supabase.from("rewards").update(update).eq("id", id).eq("org_id", g.org.id);
  if (error) back(ledgerError(error.message));
  revalidatePath("/dashboard/belohnungen");
  back("Belohnung gespeichert.", true);
}

export async function setRewardActive(id: string, active: boolean) {
  const g = await gate();
  const { error } = await createClient().from("rewards").update({ active }).eq("id", id).eq("org_id", g.org.id).is("ended_at", null);
  if (error) back(ledgerError(error.message));
  revalidatePath("/dashboard/belohnungen");
  back(active ? "Belohnung ist wieder aktiv." : "Belohnung pausiert – sie kann bis zur Reaktivierung nicht eingelöst werden.", true);
}

export async function endReward(id: string) {
  const g = await gate();
  const { error } = await createClient().from("rewards").update({ ended_at: new Date().toISOString(), active: false }).eq("id", id).eq("org_id", g.org.id).eq("is_default", false);
  if (error) back(ledgerError(error.message));
  revalidatePath("/dashboard/belohnungen");
  back("Belohnung beendet. Sie bleibt im Verlauf sichtbar, kann aber nicht mehr eingelöst werden.", true);
}

export async function deleteReward(id: string) {
  const g = await gate();
  const { error, count } = await createClient().from("rewards").delete({ count: "exact" }).eq("id", id).eq("org_id", g.org.id);
  if (error) back(ledgerError(error.message));
  if (!count) back("Belohnung nicht gefunden.");
  revalidatePath("/dashboard/belohnungen");
  back("Belohnung gelöscht.", true);
}
