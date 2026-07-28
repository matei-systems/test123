"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

// Neues Treueprogramm (Karten-Vorlage) anlegen
export async function createProgram(formData: FormData) {
  const { org } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  const supabase = createClient();
  const type = String(formData.get("type")) === "points" ? "points" : "stamp";

  const { error } = await supabase.from("loyalty_programs").insert({
    org_id: org.id,
    name: String(formData.get("name")),
    title: String(formData.get("title")),
    type,
    stamps_required: Number(formData.get("stamps_required")) || 10,
    points_per_reward: Number(formData.get("points_per_reward")) || 100,
    reward_description: String(formData.get("reward_description")),
    design: {
      theme: Number(formData.get("theme")) || 0,
      logo: (String(formData.get("logo")) || "C").toUpperCase().slice(0, 2),
    },
  });

  if (error) redirect("/dashboard/programs?error=" + encodeURIComponent(error.message));
  revalidatePath("/dashboard/programs");
  redirect("/dashboard/programs");
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
    revalidatePath(`/dashboard/programs/${programId}`);
    return;
  }

  await supabase.from("cards").insert({
    org_id: orgId,
    program_id: programId,
    customer_id: cust.id,
  });

  revalidatePath(`/dashboard/programs/${programId}`);
}

// +1 Stempel  (schreibt zusätzlich ins transactions-Journal)
export async function addStamp(formData: FormData) {
  const cardId = String(formData.get("cardId"));
  const programId = String(formData.get("programId"));
  const supabase = createClient();

  const { data: card } = await supabase
    .from("cards")
    .select("stamps, org_id, loyalty_programs(stamps_required)")
    .eq("id", cardId)
    .single();
  if (!card) return;

  const req = (card as any).loyalty_programs?.stamps_required ?? 10;
  const next = Math.min((card as any).stamps + 1, req);

  await supabase.from("cards").update({ stamps: next }).eq("id", cardId);
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

  const { data: card } = await supabase
    .from("cards")
    .select("points, org_id")
    .eq("id", cardId)
    .single();
  if (!card) return;

  await supabase.from("cards").update({ points: (card as any).points + 10 }).eq("id", cardId);
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

  const { data: card } = await supabase
    .from("cards")
    .select("stamps, points, org_id, program_id, loyalty_programs(type, stamps_required, points_per_reward)")
    .eq("id", cardId)
    .single();
  if (!card) return;

  const p = (card as any).loyalty_programs;
  const isStamp = p?.type === "stamp";
  const ready = isStamp
    ? (card as any).stamps >= p.stamps_required
    : (card as any).points >= p.points_per_reward;
  if (!ready) return;

  const update = isStamp
    ? { stamps: 0 }
    : { points: (card as any).points - p.points_per_reward };

  await supabase.from("cards").update(update).eq("id", cardId);
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
