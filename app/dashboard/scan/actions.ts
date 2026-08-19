"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { translateDbError } from "@/lib/db-errors";
import { checkStampCooldown } from "@/lib/abuse-protection";
import { requireOrgRole } from "@/lib/org";
import { notifyWalletsOfCardUpdate } from "@/lib/wallet-updates";
import { unitsFromAmount } from "@/lib/earning-rules";

export interface ScannedCard {
  id: string;
  stamps: number;
  points: number;
  type: "stamp" | "points";
  stampsRequired: number;
  pointsPerReward: number;
  rewardDescription: string;
  programTitle: string;
  customerName: string;
  ready: boolean;
  earningMode: "manual" | "amount";
  minPurchaseAmount: number | null;
  amountPerPoint: number | null;
}

function serialFromScan(raw: string): string | null {
  // Erwartet dieselbe URL, die auch im QR-Code der Kundenkarte steckt:
  // <appUrl>/c/<serial>. Nimmt zur Sicherheit trotzdem nur das letzte
  // URL-Segment, falls jemand nur den nackten Serial-Code scannt/eingibt.
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    return trimmed;
  }
}

async function loadCard(cardId: string): Promise<{ error?: string; card?: ScannedCard }> {
  const supabase = createClient();
  const { data: card, error } = await supabase
    .from("cards")
    .select(
      "id, stamps, points, customers(full_name), loyalty_programs(type, title, name, stamps_required, points_per_reward, reward_description, earning_mode, min_purchase_amount, amount_per_point)"
    )
    .eq("id", cardId)
    .single();

  if (error || !card) return { error: "Karte nicht gefunden." };

  const p = (card as any).loyalty_programs;
  const isStamp = p?.type === "stamp";
  const ready = isStamp ? card.stamps >= p.stamps_required : card.points >= p.points_per_reward;

  return {
    card: {
      id: card.id,
      stamps: card.stamps,
      points: card.points,
      type: p?.type ?? "stamp",
      stampsRequired: p?.stamps_required ?? 10,
      pointsPerReward: p?.points_per_reward ?? 100,
      rewardDescription: p?.reward_description ?? "",
      programTitle: p?.title ?? p?.name ?? "Programm",
      customerName: (card as any).customers?.full_name ?? "Kunde",
      ready,
      earningMode: p?.earning_mode ?? "manual",
      minPurchaseAmount: p?.min_purchase_amount ?? null,
      amountPerPoint: p?.amount_per_point ?? null,
    },
  };
}

// Scan-Ergebnis: RLS sorgt automatisch dafür, dass eine Karte eines fremden
// Betriebs schlicht "nicht gefunden" zurückgibt - kein zusätzlicher
// manueller org_id-Check nötig, das übernimmt die DB-Policy.
export async function lookupScannedCard(rawText: string): Promise<{ error?: string; card?: ScannedCard }> {
  const serial = serialFromScan(rawText);
  if (!serial) return { error: "QR-Code konnte nicht gelesen werden." };

  const supabase = createClient();
  const { data: card, error } = await supabase.from("cards").select("id").eq("serial_number", serial).maybeSingle();
  if (error || !card) return { error: "Diese Karte gehört nicht zu deinem Betrieb oder existiert nicht." };

  return loadCard(card.id);
}

export async function scanStamp(cardId: string, purchaseAmount?: number): Promise<{ error?: string; card?: ScannedCard }> {
  const gate = await requireOrgRole("staff");
  if (!gate.ok) return { error: gate.error };

  const supabase = createClient();
  const cooldownError = await checkStampCooldown(supabase, cardId);
  if (cooldownError) return { error: cooldownError };

  const { data: card, error: fetchErr } = await supabase
    .from("cards")
    .select("stamps, org_id, loyalty_programs(stamps_required, earning_mode, min_purchase_amount)")
    .eq("id", cardId)
    .single();
  if (fetchErr || !card) return { error: "Karte nicht gefunden." };

  const p = (card as any).loyalty_programs;
  let units = 1;
  if (p?.earning_mode === "amount") {
    if (purchaseAmount === undefined || Number.isNaN(purchaseAmount) || purchaseAmount < 0) {
      return { error: "Bitte gib den Einkaufsbetrag an." };
    }
    const result = unitsFromAmount(
      { type: "stamp", earning_mode: p.earning_mode, min_purchase_amount: p.min_purchase_amount, amount_per_point: null },
      purchaseAmount
    );
    if (result.units <= 0) return { error: result.error ?? "Kein Stempel fällig." };
    units = result.units;
  }

  const req = p?.stamps_required ?? 10;
  const next = Math.min(card.stamps + units, req);

  const { error: updErr } = await supabase.from("cards").update({ stamps: next }).eq("id", cardId);
  if (updErr) return { error: translateDbError(updErr.message) };

  await supabase.from("transactions").insert({
    org_id: card.org_id,
    card_id: cardId,
    type: "stamp",
    amount: next - card.stamps,
    note: p?.earning_mode === "amount" ? `Einkauf: ${purchaseAmount!.toFixed(2)} €` : null,
    staff_id: gate.user.id,
    location_id: gate.locationId,
  });
  notifyWalletsOfCardUpdate(cardId).catch(() => {});
  revalidatePath("/dashboard");
  return loadCard(cardId);
}

export async function scanAddPoints(cardId: string, purchaseAmount?: number): Promise<{ error?: string; card?: ScannedCard }> {
  const gate = await requireOrgRole("staff");
  if (!gate.ok) return { error: gate.error };

  const supabase = createClient();
  const { data: card, error: fetchErr } = await supabase
    .from("cards")
    .select("points, org_id, loyalty_programs(earning_mode, amount_per_point)")
    .eq("id", cardId)
    .single();
  if (fetchErr || !card) return { error: "Karte nicht gefunden." };

  const p = (card as any).loyalty_programs;
  let units = 10;
  if (p?.earning_mode === "amount") {
    if (purchaseAmount === undefined || Number.isNaN(purchaseAmount) || purchaseAmount < 0) {
      return { error: "Bitte gib den Einkaufsbetrag an." };
    }
    const result = unitsFromAmount(
      { type: "points", earning_mode: p.earning_mode, min_purchase_amount: null, amount_per_point: p.amount_per_point },
      purchaseAmount
    );
    if (result.units <= 0) return { error: result.error ?? "Keine Punkte fällig." };
    units = result.units;
  }

  const { error: updErr } = await supabase.from("cards").update({ points: card.points + units }).eq("id", cardId);
  if (updErr) return { error: translateDbError(updErr.message) };

  await supabase.from("transactions").insert({
    org_id: card.org_id,
    card_id: cardId,
    type: "points",
    amount: units,
    note: p?.earning_mode === "amount" ? `Einkauf: ${purchaseAmount!.toFixed(2)} €` : null,
    staff_id: gate.user.id,
    location_id: gate.locationId,
  });
  notifyWalletsOfCardUpdate(cardId).catch(() => {});
  revalidatePath("/dashboard");
  return loadCard(cardId);
}

export async function scanRedeem(cardId: string): Promise<{ error?: string; card?: ScannedCard }> {
  const gate = await requireOrgRole("staff");
  if (!gate.ok) return { error: gate.error };

  const supabase = createClient();
  const { data: card, error: fetchErr } = await supabase
    .from("cards")
    .select("stamps, points, org_id, loyalty_programs(type, stamps_required, points_per_reward)")
    .eq("id", cardId)
    .single();
  if (fetchErr || !card) return { error: "Karte nicht gefunden." };

  const p = (card as any).loyalty_programs;
  const isStamp = p?.type === "stamp";
  const ready = isStamp ? card.stamps >= p.stamps_required : card.points >= p.points_per_reward;
  if (!ready) return { error: "Belohnung ist noch nicht freigeschaltet." };

  const update = isStamp ? { stamps: 0 } : { points: card.points - p.points_per_reward };
  const { error: updErr } = await supabase.from("cards").update(update).eq("id", cardId);
  if (updErr) return { error: translateDbError(updErr.message) };

  await supabase.from("reward_redemptions").insert({ org_id: card.org_id, card_id: cardId, staff_id: gate.user.id });
  await supabase.from("transactions").insert({
    org_id: card.org_id,
    card_id: cardId,
    type: "redeem",
    amount: 1,
    staff_id: gate.user.id,
    location_id: gate.locationId,
  });
  notifyWalletsOfCardUpdate(cardId).catch(() => {});
  revalidatePath("/dashboard");
  return loadCard(cardId);
}
