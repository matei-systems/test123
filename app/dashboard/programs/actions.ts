"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrgRole } from "@/lib/org";
import { translateDbError } from "@/lib/db-errors";
import { checkStampCooldown } from "@/lib/abuse-protection";
import type { CardDesign } from "@/lib/card-design";
import { upsertGoogleLoyaltyClass } from "@/lib/google-wallet";
import { notifyWalletsOfCardUpdate, registerWalletObjectsForNewCard } from "@/lib/wallet-updates";
import { unitsFromAmount } from "@/lib/earning-rules";

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

  if (error) return { error: translateDbError(error.message) };
  revalidatePath("/dashboard/programs");
  return {};
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

// +1 Stempel (oder nach Verdienregel via Einkaufsbetrag) - schreibt
// zusätzlich ins transactions-Journal.
export async function addStamp(formData: FormData) {
  const cardId = String(formData.get("cardId"));
  const programId = String(formData.get("programId"));
  const amountRaw = formData.get("amount");

  const gate = await requireOrgRole("staff");
  if (!gate.ok) redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent(gate.error));

  const supabase = createClient();

  const { data: card, error: fetchErr } = await supabase
    .from("cards")
    .select("stamps, org_id, loyalty_programs(stamps_required, earning_mode, min_purchase_amount)")
    .eq("id", cardId)
    .single();
  if (fetchErr || !card) {
    redirect(
      `/dashboard/programs/${programId}?error=` +
        encodeURIComponent(fetchErr ? translateDbError(fetchErr.message) : "Karte nicht gefunden.")
    );
  }

  const p = (card as any).loyalty_programs;
  let units = 1;
  if (p?.earning_mode === "amount") {
    const amount = Number(amountRaw);
    if (!amountRaw || Number.isNaN(amount) || amount < 0) {
      redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent("Bitte gib den Einkaufsbetrag an."));
    }
    const result = unitsFromAmount(
      { type: "stamp", earning_mode: p.earning_mode, min_purchase_amount: p.min_purchase_amount, amount_per_point: null },
      amount
    );
    if (result.units <= 0) {
      redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent(result.error ?? "Kein Stempel fällig."));
    }
    units = result.units;
  }

  const cooldownError = await checkStampCooldown(supabase, cardId);
  if (cooldownError) {
    redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent(cooldownError));
  }

  const req = p?.stamps_required ?? 10;
  const next = Math.min((card as any).stamps + units, req);

  const { error: updErr } = await supabase.from("cards").update({ stamps: next }).eq("id", cardId);
  if (updErr) {
    redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent(translateDbError(updErr.message)));
  }
  await supabase.from("transactions").insert({
    org_id: (card as any).org_id,
    card_id: cardId,
    type: "stamp",
    amount: next - (card as any).stamps,
    note: p?.earning_mode === "amount" ? `Einkauf: ${Number(amountRaw).toFixed(2)} €` : null,
    staff_id: gate.user.id,
    location_id: gate.locationId,
  });
  notifyWalletsOfCardUpdate(cardId).catch(() => {});
  revalidatePath(`/dashboard/programs/${programId}`);
}

// +10 Punkte (oder nach Verdienregel via Einkaufsbetrag)
export async function addPoints(formData: FormData) {
  const cardId = String(formData.get("cardId"));
  const programId = String(formData.get("programId"));
  const amountRaw = formData.get("amount");

  const gate = await requireOrgRole("staff");
  if (!gate.ok) redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent(gate.error));

  const supabase = createClient();

  const { data: card, error: fetchErr } = await supabase
    .from("cards")
    .select("points, org_id, loyalty_programs(earning_mode, amount_per_point)")
    .eq("id", cardId)
    .single();
  if (fetchErr || !card) {
    redirect(
      `/dashboard/programs/${programId}?error=` +
        encodeURIComponent(fetchErr ? translateDbError(fetchErr.message) : "Karte nicht gefunden.")
    );
  }

  const p = (card as any).loyalty_programs;
  let units = 10;
  if (p?.earning_mode === "amount") {
    const amount = Number(amountRaw);
    if (!amountRaw || Number.isNaN(amount) || amount < 0) {
      redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent("Bitte gib den Einkaufsbetrag an."));
    }
    const result = unitsFromAmount(
      { type: "points", earning_mode: p.earning_mode, min_purchase_amount: null, amount_per_point: p.amount_per_point },
      amount
    );
    if (result.units <= 0) {
      redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent(result.error ?? "Keine Punkte fällig."));
    }
    units = result.units;
  }

  const { error: updErr } = await supabase
    .from("cards")
    .update({ points: (card as any).points + units })
    .eq("id", cardId);
  if (updErr) {
    redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent(translateDbError(updErr.message)));
  }
  await supabase.from("transactions").insert({
    org_id: (card as any).org_id,
    card_id: cardId,
    type: "points",
    amount: units,
    note: p?.earning_mode === "amount" ? `Einkauf: ${Number(amountRaw).toFixed(2)} €` : null,
    staff_id: gate.user.id,
    location_id: gate.locationId,
  });
  notifyWalletsOfCardUpdate(cardId).catch(() => {});
  revalidatePath(`/dashboard/programs/${programId}`);
}

// Belohnung einlösen: setzt Stempel zurück / zieht Punkte ab + protokolliert
export async function redeem(formData: FormData) {
  const cardId = String(formData.get("cardId"));
  const programId = String(formData.get("programId"));

  const gate = await requireOrgRole("staff");
  if (!gate.ok) redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent(gate.error));

  const supabase = createClient();

  const { data: card, error: fetchErr } = await supabase
    .from("cards")
    .select("stamps, points, org_id, program_id, loyalty_programs(type, stamps_required, points_per_reward)")
    .eq("id", cardId)
    .single();
  if (fetchErr || !card) {
    redirect(
      `/dashboard/programs/${programId}?error=` +
        encodeURIComponent(fetchErr ? translateDbError(fetchErr.message) : "Karte nicht gefunden.")
    );
  }

  const p = (card as any).loyalty_programs;
  const isStamp = p?.type === "stamp";
  const ready = isStamp
    ? (card as any).stamps >= p.stamps_required
    : (card as any).points >= p.points_per_reward;
  if (!ready) {
    redirect(
      `/dashboard/programs/${programId}?error=` +
        encodeURIComponent("Belohnung ist noch nicht freigeschaltet.")
    );
  }

  const update = isStamp
    ? { stamps: 0 }
    : { points: (card as any).points - p.points_per_reward };

  const { error: updErr } = await supabase.from("cards").update(update).eq("id", cardId);
  if (updErr) {
    redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent(translateDbError(updErr.message)));
  }
  await supabase.from("reward_redemptions").insert({
    org_id: (card as any).org_id,
    card_id: cardId,
    staff_id: gate.user.id,
  });
  await supabase.from("transactions").insert({
    org_id: (card as any).org_id,
    card_id: cardId,
    type: "redeem",
    amount: 1,
    staff_id: gate.user.id,
    location_id: gate.locationId,
  });
  notifyWalletsOfCardUpdate(cardId).catch(() => {});
  revalidatePath(`/dashboard/programs/${programId}`);
}
