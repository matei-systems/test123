"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { translateDbError } from "@/lib/db-errors";

export interface ProgramInput {
  name: string;
  title: string;
  type: "stamp" | "points";
  stampsRequired: number;
  pointsPerReward: number;
  rewardDescription: string;
  theme: number;
  logo: string;
  logoImage: string | null;
}

function validate(input: ProgramInput): string | null {
  if (!input.name.trim()) return "Bitte gib einen internen Programmnamen an.";
  if (!input.title.trim()) return "Bitte gib einen Anzeigenamen für die Karte an.";
  if (!input.rewardDescription.trim()) return "Bitte beschreibe die Belohnung.";
  if (input.type === "stamp" && (input.stampsRequired < 3 || input.stampsRequired > 20))
    return "Stempel bis Belohnung muss zwischen 3 und 20 liegen.";
  if (input.type === "points" && input.pointsPerReward < 10) return "Punkte bis Belohnung muss mindestens 10 sein.";
  return null;
}

function toRow(input: ProgramInput) {
  const logo = input.logo.trim() || input.title.trim().slice(0, 1) || "C";
  return {
    name: input.name.trim(),
    title: input.title.trim(),
    type: input.type,
    stamps_required: input.stampsRequired,
    points_per_reward: input.pointsPerReward,
    reward_description: input.rewardDescription.trim(),
    design: { theme: input.theme, logo: logo.toUpperCase().slice(0, 2), logoImage: input.logoImage },
  };
}

// Neues Treueprogramm (Karten-Vorlage) anlegen - aufgerufen direkt aus dem
// Wizard (Client Component), daher Rückgabewert statt redirect() im Fehlerfall,
// damit der mehrstufige Formularzustand bei einem Fehler erhalten bleibt.
export async function createProgram(input: ProgramInput): Promise<{ error?: string; id?: string }> {
  const invalid = validate(input);
  if (invalid) return { error: invalid };

  const { org } = await getCurrentOrg();
  if (!org) return { error: "Kein Betrieb gefunden." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("loyalty_programs")
    .insert({ org_id: org.id, ...toRow(input) })
    .select("id")
    .single();

  if (error || !data) return { error: error ? translateDbError(error.message) : "Programm konnte nicht gespeichert werden." };
  revalidatePath("/dashboard/programs");
  return { id: data.id };
}

// Bestehendes Programm bearbeiten
export async function updateProgram(id: string, input: ProgramInput): Promise<{ error?: string }> {
  const invalid = validate(input);
  if (invalid) return { error: invalid };

  const { org } = await getCurrentOrg();
  if (!org) return { error: "Kein Betrieb gefunden." };

  const supabase = createClient();
  const { error } = await supabase
    .from("loyalty_programs")
    .update(toRow(input))
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) return { error: translateDbError(error.message) };
  revalidatePath("/dashboard/programs");
  revalidatePath(`/dashboard/programs/${id}`);
  return {};
}

// Programm löschen (Karten/Transaktionen/Rewards hängen per ON DELETE CASCADE daran)
export async function deleteProgram(id: string): Promise<{ error?: string }> {
  const { org } = await getCurrentOrg();
  if (!org) return { error: "Kein Betrieb gefunden." };

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

  const { error: cardErr } = await supabase.from("cards").insert({
    org_id: orgId,
    program_id: programId,
    customer_id: cust.id,
  });

  if (cardErr) {
    redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent(translateDbError(cardErr.message)));
  }

  revalidatePath(`/dashboard/programs/${programId}`);
}

// +1 Stempel  (schreibt zusätzlich ins transactions-Journal)
export async function addStamp(formData: FormData) {
  const cardId = String(formData.get("cardId"));
  const programId = String(formData.get("programId"));
  const supabase = createClient();

  const { data: card, error: fetchErr } = await supabase
    .from("cards")
    .select("stamps, org_id, loyalty_programs(stamps_required)")
    .eq("id", cardId)
    .single();
  if (fetchErr || !card) {
    redirect(
      `/dashboard/programs/${programId}?error=` +
        encodeURIComponent(fetchErr ? translateDbError(fetchErr.message) : "Karte nicht gefunden.")
    );
  }

  const req = (card as any).loyalty_programs?.stamps_required ?? 10;
  const next = Math.min((card as any).stamps + 1, req);

  const { error: updErr } = await supabase.from("cards").update({ stamps: next }).eq("id", cardId);
  if (updErr) {
    redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent(translateDbError(updErr.message)));
  }
  await supabase.from("transactions").insert({
    org_id: (card as any).org_id,
    card_id: cardId,
    type: "stamp",
    amount: 1,
  });
  revalidatePath(`/dashboard/programs/${programId}`);
}

// +10 Punkte
export async function addPoints(formData: FormData) {
  const cardId = String(formData.get("cardId"));
  const programId = String(formData.get("programId"));
  const supabase = createClient();

  const { data: card, error: fetchErr } = await supabase
    .from("cards")
    .select("points, org_id")
    .eq("id", cardId)
    .single();
  if (fetchErr || !card) {
    redirect(
      `/dashboard/programs/${programId}?error=` +
        encodeURIComponent(fetchErr ? translateDbError(fetchErr.message) : "Karte nicht gefunden.")
    );
  }

  const { error: updErr } = await supabase
    .from("cards")
    .update({ points: (card as any).points + 10 })
    .eq("id", cardId);
  if (updErr) {
    redirect(`/dashboard/programs/${programId}?error=` + encodeURIComponent(translateDbError(updErr.message)));
  }
  await supabase.from("transactions").insert({
    org_id: (card as any).org_id,
    card_id: cardId,
    type: "points",
    amount: 10,
  });
  revalidatePath(`/dashboard/programs/${programId}`);
}

// Belohnung einlösen: setzt Stempel zurück / zieht Punkte ab + protokolliert
export async function redeem(formData: FormData) {
  const cardId = String(formData.get("cardId"));
  const programId = String(formData.get("programId"));
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
  });
  await supabase.from("transactions").insert({
    org_id: (card as any).org_id,
    card_id: cardId,
    type: "redeem",
    amount: 1,
  });
  revalidatePath(`/dashboard/programs/${programId}`);
}
