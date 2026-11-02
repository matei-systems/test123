"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrgRole } from "@/lib/org";
import { earnOnCard, redeemReward, redeemWithCode, serialFromInput } from "@/lib/ledger";
import { rewardIsCurrent } from "@/lib/konto";

export interface ScannedReward {
  id: string;
  title: string;
  cost: number;
  conditions: string | null;
  available: boolean;
}

export interface ScannedCard {
  id: string;
  type: "stamp" | "points";
  balance: number;
  stampsRequired: number;
  programTitle: string;
  programActive: boolean;
  customerName: string;
  earningMode: "manual" | "amount";
  minPurchaseAmount: number | null;
  amountPerPoint: number | null;
  status: string;
  rewards: ScannedReward[];
}

export interface ScannedCode {
  requestId: string;
  token: string;
  shortCode: string;
  status: string;
  expiresAt: string;
  rewardTitle: string;
  cost: number;
  type: "stamp" | "points";
  balance: number;
  customerName: string;
  cardId: string;
}

export type ScanResult = { error: string } | { kind: "card"; card: ScannedCard } | { kind: "code"; code: ScannedCode };

async function loadCard(cardId: string): Promise<ScanResult> {
  const supabase = createClient();
  const { data: card } = await supabase
    .from("cards")
    .select(
      "id, stamps, points, status, program_id, customers(full_name), loyalty_programs(type, title, name, active, stamps_required, earning_mode, min_purchase_amount, amount_per_point)"
    )
    .eq("id", cardId)
    .maybeSingle();
  if (!card) return { error: "Diese Karte gehört nicht zu deinem Betrieb oder existiert nicht." };

  const p = (card as any).loyalty_programs;
  const balance = p?.type === "stamp" ? card.stamps : card.points;
  const { data: rewards } = await supabase
    .from("rewards")
    .select("id, title, cost_points, conditions, valid_from, valid_until")
    .eq("program_id", card.program_id)
    .eq("active", true)
    .is("ended_at", null)
    .order("cost_points", { ascending: true });

  return {
    kind: "card",
    card: {
      id: card.id,
      type: p?.type ?? "stamp",
      balance,
      stampsRequired: p?.stamps_required ?? 10,
      programTitle: p?.title ?? p?.name ?? "Programm",
      programActive: Boolean(p?.active),
      customerName: (card as any).customers?.full_name ?? "Kunde",
      earningMode: p?.earning_mode ?? "manual",
      minPurchaseAmount: p?.min_purchase_amount ?? null,
      amountPerPoint: p?.amount_per_point ?? null,
      status: card.status,
      rewards: (rewards ?? [])
        .filter((r: any) => rewardIsCurrent(r))
        .map((r: any) => ({ id: r.id, title: r.title, cost: r.cost_points, conditions: r.conditions, available: r.cost_points <= balance })),
    },
  };
}

const CODE_SELECT =
  "id, token, short_code, status, expires_at, card_id, rewards(title, cost_points), cards(stamps, points, customers(full_name), loyalty_programs(type))";

function toCode(row: any): ScannedCode {
  const type = row.cards?.loyalty_programs?.type ?? "stamp";
  const expired = row.status === "pending" && new Date(row.expires_at).getTime() < Date.now();
  return {
    requestId: row.id,
    token: row.token,
    shortCode: row.short_code,
    status: expired ? "expired" : row.status,
    expiresAt: row.expires_at,
    rewardTitle: row.rewards?.title ?? "Belohnung",
    cost: row.rewards?.cost_points ?? 0,
    type,
    balance: type === "stamp" ? row.cards?.stamps ?? 0 : row.cards?.points ?? 0,
    customerName: row.cards?.customers?.full_name ?? "Kunde",
    cardId: row.card_id,
  };
}

function codeProblem(c: ScannedCode): string | null {
  if (c.status === "used") return "Dieser Einlöse-Code wurde bereits eingelöst.";
  if (c.status === "expired") return "Dieser Einlöse-Code ist abgelaufen. Der Kunde kann in seinem Konto einen neuen anzeigen.";
  if (c.status === "cancelled") return "Dieser Code wurde durch einen neueren ersetzt. Bitte den aktuellen Code scannen.";
  return null;
}

// Vorschau eines gescannten Codes: Kundenkarte (URL/Seriennummer) oder
// Einlöse-Code (36-stelliger Token). RLS liefert nur Daten des eigenen
// Betriebs; fremde Karten/Codes erscheinen als "nicht gefunden".
export async function lookupScan(rawText: string): Promise<ScanResult> {
  const gate = await requireOrgRole("staff", { requireActive: false });
  if (!gate.ok) return { error: gate.error };
  const supabase = createClient();

  const compact = rawText.trim().replace(/[^A-Za-z0-9]/g, "");
  if (/^[0-9a-f]{36}$/i.test(compact)) {
    const { data } = await supabase.from("redemption_requests").select(CODE_SELECT).eq("token", compact.toLowerCase()).maybeSingle();
    if (!data) return { error: "Dieser Einlöse-Code ist ungültig oder gehört nicht zu deinem Betrieb." };
    const code = toCode(data);
    const problem = codeProblem(code);
    return problem ? { error: problem } : { kind: "code", code };
  }

  const serial = serialFromInput(rawText);
  if (!serial) return { error: "QR-Code konnte nicht gelesen werden." };
  const { data: card } = await supabase.from("cards").select("id").eq("serial_number", serial).maybeSingle();
  if (!card) return { error: "Diese Karte gehört nicht zu deinem Betrieb oder existiert nicht." };
  return loadCard(card.id);
}

export async function lookupShortCode(input: string): Promise<ScanResult> {
  const gate = await requireOrgRole("staff", { requireActive: false });
  if (!gate.ok) return { error: gate.error };
  const code = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (code.length !== 6) return { error: "Der Kurzcode hat 6 Zeichen (Buchstaben und Ziffern)." };
  const { data } = await createClient()
    .from("redemption_requests")
    .select(CODE_SELECT)
    .eq("org_id", gate.org.id)
    .eq("short_code", code)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return { error: "Kein offener Einlöse-Code mit diesem Kurzcode gefunden." };
  const c = toCode(data);
  const problem = codeProblem(c);
  return problem ? { error: problem } : { kind: "code", code: c };
}

export async function scanEarn(cardId: string, purchaseAmount: number | null, requestId: string): Promise<ScanResult & { message?: string }> {
  const gate = await requireOrgRole("staff");
  if (!gate.ok) return { error: gate.error };
  const res = await earnOnCard(createClient(), cardId, purchaseAmount, requestId);
  if (!res.ok) return { error: res.error };
  revalidatePath("/dashboard");
  const d = res.data;
  const unit = d.type === "stamp" ? "Stempel" : d.units === 1 ? "Punkt" : "Punkte";
  const next = await loadCard(cardId);
  return { ...next, message: d.duplicate ? "Bereits gebucht" : `+${d.units} ${unit}${d.factor > 1 ? ` (Aktion ×${d.factor})` : ""}` };
}

export async function scanRedeemReward(cardId: string, rewardId: string, requestId: string): Promise<ScanResult & { message?: string }> {
  const gate = await requireOrgRole("staff");
  if (!gate.ok) return { error: gate.error };
  const res = await redeemReward(createClient(), cardId, rewardId, requestId);
  if (!res.ok) return { error: res.error };
  revalidatePath("/dashboard");
  const next = await loadCard(cardId);
  return { ...next, message: res.data.duplicate ? "Bereits eingelöst" : `Eingelöst: ${res.data.reward_title ?? "Belohnung"}` };
}

export async function scanRedeemCode(token: string, requestId: string): Promise<{ error?: string; message?: string }> {
  const gate = await requireOrgRole("staff");
  if (!gate.ok) return { error: gate.error };
  const res = await redeemWithCode(createClient(), token, requestId);
  if (!res.ok) return { error: res.error };
  revalidatePath("/dashboard");
  return { message: res.data.duplicate ? "Bereits eingelöst" : `Eingelöst: ${res.data.reward_title ?? "Belohnung"}` };
}
