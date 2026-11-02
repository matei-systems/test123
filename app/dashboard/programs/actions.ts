"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrgRole } from "@/lib/org";
import { translateDbError } from "@/lib/db-errors";
import type { CardDesign } from "@/lib/card-design";
import { upsertGoogleLoyaltyClass } from "@/lib/google-wallet";
import { registerWalletObjectsForNewCard } from "@/lib/wallet-updates";
import { earnOnCard, ledgerError, redeemReward } from "@/lib/ledger";

export interface ProgramInput {
  name: string;
  title: string;
  type: "stamp" | "points";
  stampsRequired: number;
  pointsPerReward: number;
  rewardDescription: string;
  design: CardDesign;
  earningMode: "manual" | "amount";
  minPurchaseAmount: number | null;
  amountPerPoint: number | null;
}

function validate(input: ProgramInput): string | null {
  if (!input.name.trim()) return "Bitte gib einen internen Programmnamen an.";
  if (!input.title.trim()) return "Bitte gib einen Anzeigenamen für die Karte an.";
  if (!input.rewardDescription.trim()) return "Bitte beschreibe die Belohnung.";
  if (input.type === "stamp" && (input.stampsRequired < 3 || input.stampsRequired > 30))
    return "Stempel bis Belohnung muss zwischen 3 und 30 liegen.";
  if (input.type === "points" && input.pointsPerReward < 10) return "Punkte bis Belohnung muss mindestens 10 sein.";
  if (input.earningMode === "amount") {
    if (input.type === "stamp" && (!input.minPurchaseAmount || input.minPurchaseAmount <= 0))
      return "Bitte gib den Mindestbetrag für einen Stempel an.";
    if (input.type === "points" && (!input.amountPerPoint || input.amountPerPoint <= 0))
      return "Bitte gib den Betrag pro Punkt an.";
  }
  return null;
}

function toRow(input: ProgramInput) {
  const logo = input.design.logo.trim() || input.title.trim().slice(0, 1) || "C";
  return {
    name: input.name.trim(),
    title: input.title.trim(),
    type: input.type,
    stamps_required: input.stampsRequired,
    points_per_reward: input.pointsPerReward,
    reward_description: input.rewardDescription.trim(),
    design: { ...input.design, logo: logo.toUpperCase().slice(0, 2) },
    earning_mode: input.earningMode,
    min_purchase_amount: input.earningMode === "amount" && input.type === "stamp" ? input.minPurchaseAmount : null,
    amount_per_point: input.earningMode === "amount" && input.type === "points" ? input.amountPerPoint : null,
  };
}

// Neues Treueprogramm (Karten-Vorlage) anlegen - aufgerufen direkt aus dem
// Wizard (Client Component), daher Rückgabewert statt redirect() im Fehlerfall,
// damit der mehrstufige Formularzustand bei einem Fehler erhalten bleibt.
export async function createProgram(input: ProgramInput): Promise<{ error?: string; id?: string }> {
  const invalid = validate(input);
  if (invalid) return { error: invalid };

  const gate = await requireOrgRole("admin");
  if (!gate.ok) return { error: gate.error };
  const { org } = gate;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("loyalty_programs")
    .insert({ org_id: org.id, ...toRow(input) })
    .select("id")
    .single();

  if (error || !data) return { error: error ? translateDbError(error.message) : "Programm konnte nicht gespeichert werden." };
  upsertGoogleLoyaltyClass({ programId: data.id, orgName: org.name, programTitle: input.title, logoUrl: input.design.logoImage }).catch(() => {});
  revalidatePath("/dashboard/programs");
  return { id: data.id };
}

// Bestehendes Programm bearbeiten
export async function updateProgram(id: string, input: ProgramInput): Promise<{ error?: string }> {
  const invalid = validate(input);
  if (invalid) return { error: invalid };

  const gate = await requireOrgRole("admin");
  if (!gate.ok) return { error: gate.error };
  const { org } = gate;

  const supabase = createClient();
  const { error } = await supabase
    .from("loyalty_programs")
    .update(toRow(input))
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) return { error: translateDbError(error.message) };
  upsertGoogleLoyaltyClass({ programId: id, orgName: org.name, programTitle: input.title, logoUrl: input.design.logoImage }).catch(() => {});
  revalidatePath("/dashboard/programs");
  revalidatePath(`/dashboard/programs/${id}`);
  return {};
}

// Programm löschen (Karten/Transaktionen/Rewards hängen per ON DELETE CASCADE daran)
export async function deleteProgram(id: string): Promise<{ error?: string }> {
  const gate = await requireOrgRole("admin");
  if (!gate.ok) return { error: gate.error };
  const { org } = gate;

  const supabase = createClient();
  const { error } = await supabase.from("loyalty_programs").delete().eq("id", id).eq("org_id", org.id);

  // Programme mit Karten blockiert die Datenbank (MATEI_PROGRAM_HAS_CARDS) -
  // sonst wären Kundenstände und Buchungen unwiderruflich weg.
  if (error) return { error: ledgerError(error.message) };
  revalidatePath("/dashboard/programs");
  return {};
}

// Programm pausieren/aktivieren - der sichere Weg statt Löschen, sobald es
// Karten gibt. Pausiert: keine Vergabe/Einlösung, kein öffentlicher Beitritt.
export async function setProgramActive(id: string, active: boolean) {
  const gate = await requireOrgRole("admin");
  if (!gate.ok) redirect(`/dashboard/programs/${encodeURIComponent(id)}?error=` + encodeURIComponent(gate.error));
  const supabase = createClient();
  const { error } = await supabase.from("loyalty_programs").update({ active }).eq("id", id).eq("org_id", gate.org.id);
  if (error) redirect(`/dashboard/programs/${encodeURIComponent(id)}?error=` + encodeURIComponent(ledgerError(error.message)));
  revalidatePath(`/dashboard/programs/${id}`);
  revalidatePath("/dashboard/programs");
  redirect(`/dashboard/programs/${encodeURIComponent(id)}?ok=` + encodeURIComponent(active ? "Programm ist wieder aktiv." : "Programm ist pausiert."));
}

// Karte an einen (neuen) Kunden ausgeben
export async function issueCard(formData: FormData) {
  const orgId = String(formData.get("orgId"));
  const programId = String(formData.get("programId"));

  const gate = await requireOrgRole("staff");
  if (!gate.ok) redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent(gate.error));

  const supabase = createClient();

  const { data: cust, error: cErr } = await supabase
    .from("customers")
    .insert({
      org_id: orgId,
      full_name: String(formData.get("full_name")),
      email: String(formData.get("email")) || null,
    })
    .select()
    .single();

  if (cErr || !cust) {
    redirect(
      `/dashboard/programs/${programId}?error=` +
        encodeURIComponent(cErr ? translateDbError(cErr.message) : "Kunde konnte nicht angelegt werden.")
    );
  }

  const { data: newCard, error: cardErr } = await supabase
    .from("cards")
    .insert({
      org_id: orgId,
      program_id: programId,
      customer_id: cust.id,
    })
    .select("id")
    .single();

  if (cardErr || !newCard) {
    redirect(
      `/dashboard/programs/${programId}?error=` +
        encodeURIComponent(cardErr ? translateDbError(cardErr.message) : "Karte konnte nicht ausgegeben werden.")
    );
  }

  registerWalletObjectsForNewCard(newCard.id).catch(() => {});
  revalidatePath(`/dashboard/programs/${programId}`);
}

// Stempel/Punkte vergeben und Belohnungen einlösen laufen ausschließlich über
// die Datenbankfunktionen (lib/ledger.ts): Mitgliedschaft, Abo, Sperre,
// Verdienregel, Aktionen, Doppel-Scan-Schutz und Guthaben werden dort unter
// Zeilensperre geprüft. requestId macht doppelt abgeschickte Formulare
// idempotent (zweiter Klick = dieselbe Buchung, keine zweite).
function programPath(formData: FormData) {
  return `/dashboard/programs/${encodeURIComponent(String(formData.get("programId") ?? ""))}`;
}

function parseAmount(raw: FormDataEntryValue | null): number | null | "invalid" {
  if (raw === null || String(raw).trim() === "") return null;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n < 100000 ? n : "invalid";
}

async function earnFromForm(formData: FormData) {
  const path = programPath(formData);
  const gate = await requireOrgRole("staff");
  if (!gate.ok) redirect(`${path}?error=` + encodeURIComponent(gate.error));

  const amount = parseAmount(formData.get("amount"));
  if (amount === "invalid") redirect(`${path}?error=` + encodeURIComponent("Bitte gib einen gültigen Einkaufsbetrag an."));

  const res = await earnOnCard(createClient(), String(formData.get("cardId")), amount as number | null, String(formData.get("requestId") ?? "") || null);
  if (!res.ok) redirect(`${path}?error=` + encodeURIComponent(res.error));
  revalidatePath(path);
  const d = res.data;
  const unit = d.type === "stamp" ? "Stempel" : d.units === 1 ? "Punkt" : "Punkte";
  redirect(`${path}?ok=` + encodeURIComponent(d.duplicate ? "Bereits gebucht." : `+${d.units} ${unit}${d.factor > 1 ? ` (Aktion ×${d.factor})` : ""} – neuer Stand ${d.balance}.`));
}

export async function addStamp(formData: FormData) {
  return earnFromForm(formData);
}

export async function addPoints(formData: FormData) {
  return earnFromForm(formData);
}

export async function redeem(formData: FormData) {
  const path = programPath(formData);
  const gate = await requireOrgRole("staff");
  if (!gate.ok) redirect(`${path}?error=` + encodeURIComponent(gate.error));
  const rewardId = String(formData.get("rewardId") ?? "");
  if (!rewardId) redirect(`${path}?error=` + encodeURIComponent("Bitte wähle eine Belohnung."));

  const res = await redeemReward(createClient(), String(formData.get("cardId")), rewardId, String(formData.get("requestId") ?? "") || null);
  if (!res.ok) redirect(`${path}?error=` + encodeURIComponent(res.error));
  revalidatePath(path);
  redirect(`${path}?ok=` + encodeURIComponent(res.data.duplicate ? "Bereits eingelöst." : `Eingelöst: ${res.data.reward_title ?? "Belohnung"} – neuer Stand ${res.data.balance}.`));
}
