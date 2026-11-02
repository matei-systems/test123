import type { SupabaseClient } from "@supabase/supabase-js";
import { balanceOf } from "@/lib/programs";

// Datenzugriff für den Kundenbereich (/konto). Läuft ausschließlich mit der
// Session des Kunden; die RLS-Policies *_owner_select liefern nur Daten zu
// Karten, deren Kundendatensatz mit diesem Konto verknüpft ist. Zusätzlich
// wird explizit auf customers.user_id gefiltert: Ist der Kunde zugleich
// Mitarbeiter eines Geschäfts, darf er dort zwar alle Karten sehen - in
// seinem Wallet erscheinen aber nur seine eigenen.

export interface WalletProgram {
  id: string;
  name: string;
  title: string | null;
  type: "stamp" | "points";
  stamps_required: number;
  points_per_reward: number;
  reward_description: string | null;
  active: boolean;
  earning_mode: string | null;
  min_purchase_amount: number | null;
  amount_per_point: number | null;
  design: any;
}

export interface WalletReward {
  id: string;
  program_id: string;
  title: string;
  description: string | null;
  cost_points: number;
  conditions: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_default: boolean;
}

export interface WalletBusiness {
  org_id: string;
  slug: string;
  display_name: string;
  logo_url: string | null;
  category: string | null;
  city: string | null;
  listing_status: string;
  is_listed: boolean;
}

export interface WalletCard {
  id: string;
  serial_number: string;
  stamps: number;
  points: number;
  status: string;
  created_at: string;
  program_id: string;
  org_id: string;
  program: WalletProgram;
  business: WalletBusiness | null;
  rewards: WalletReward[];
  balance: number;
  readyRewards: WalletReward[];
  nextReward: WalletReward | null;
  activeMultiplier: number;
}

const CARD_COLUMNS =
  "id, serial_number, stamps, points, status, created_at, program_id, org_id, customers!inner(user_id), loyalty_programs(id, name, title, type, stamps_required, points_per_reward, reward_description, active, earning_mode, min_purchase_amount, amount_per_point, design)";

export function rewardIsCurrent(r: { valid_from: string | null; valid_until: string | null }, now = Date.now()) {
  return (!r.valid_from || new Date(r.valid_from).getTime() <= now) && (!r.valid_until || new Date(r.valid_until).getTime() > now);
}

async function enrich(db: SupabaseClient, rows: any[]): Promise<WalletCard[]> {
  if (rows.length === 0) return [];
  const orgIds = Array.from(new Set(rows.map((r) => r.org_id)));
  const programIds = Array.from(new Set(rows.map((r) => r.program_id)));

  const [biz, rewards, campaigns] = await Promise.all([
    db.from("business_profiles").select("org_id, slug, display_name, logo_url, category, city, listing_status, is_listed").in("org_id", orgIds),
    db
      .from("rewards")
      .select("id, program_id, title, description, cost_points, conditions, valid_from, valid_until, is_default, sort_order")
      .in("program_id", programIds)
      .eq("active", true)
      .is("ended_at", null)
      .order("sort_order", { ascending: true })
      .order("cost_points", { ascending: true }),
    db.from("campaigns").select("org_id, program_id, type, config, starts_at, ends_at").in("org_id", orgIds).eq("type", "multiplier"),
  ]);

  const bizMap = new Map<string, WalletBusiness>((biz.data ?? []).map((b: any) => [b.org_id, b]));
  const now = Date.now();
  const currentRewards = ((rewards.data ?? []) as WalletReward[]).filter((r) => rewardIsCurrent(r, now));

  return rows.map((r) => {
    const program = r.loyalty_programs as WalletProgram;
    const list = currentRewards.filter((x) => x.program_id === r.program_id);
    const balance = balanceOf(r, program?.type ?? "stamp");
    const ready = list.filter((x) => x.cost_points <= balance);
    const next = list.filter((x) => x.cost_points > balance).sort((a, b) => a.cost_points - b.cost_points)[0] ?? null;
    const factor = ((campaigns.data ?? []) as any[])
      .filter(
        (c) =>
          c.org_id === r.org_id &&
          (!c.program_id || c.program_id === r.program_id) &&
          (!c.starts_at || new Date(c.starts_at).getTime() <= now) &&
          (!c.ends_at || new Date(c.ends_at).getTime() > now)
      )
      .reduce((m, c) => Math.max(m, Math.min(5, Math.max(1, Number(c.config?.factor) || 1))), 1);
    return {
      id: r.id,
      serial_number: r.serial_number,
      stamps: r.stamps,
      points: r.points,
      status: r.status,
      created_at: r.created_at,
      program_id: r.program_id,
      org_id: r.org_id,
      program,
      business: bizMap.get(r.org_id) ?? null,
      rewards: list,
      balance,
      readyRewards: ready,
      nextReward: next,
      activeMultiplier: factor,
    };
  });
}

export async function getWalletCards(db: SupabaseClient, userId: string) {
  const { data, error } = await db
    .from("cards")
    .select(CARD_COLUMNS)
    .eq("customers.user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return { cards: [] as WalletCard[], error: error.message };
  return { cards: await enrich(db, data ?? []), error: null };
}

export async function getWalletCard(db: SupabaseClient, userId: string, cardId: string) {
  const { data } = await db.from("cards").select(CARD_COLUMNS).eq("id", cardId).eq("customers.user_id", userId).maybeSingle();
  if (!data) return null;
  const [card] = await enrich(db, [data]);
  return card;
}

export interface HistoryEntry {
  id: string;
  type: "stamp" | "points" | "redeem" | "adjust";
  amount: number;
  note: string | null;
  created_at: string;
  balance_after: number | null;
  reward_id: string | null;
  card_id: string;
}

export async function getCardHistory(db: SupabaseClient, cardId: string, limit = 30) {
  const { data } = await db
    .from("transactions")
    .select("id, type, amount, note, created_at, balance_after, reward_id, card_id")
    .eq("card_id", cardId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as HistoryEntry[];
}

export async function getAllHistory(db: SupabaseClient, cardIds: string[], limit = 100) {
  if (cardIds.length === 0) return [] as HistoryEntry[];
  const { data } = await db
    .from("transactions")
    .select("id, type, amount, note, created_at, balance_after, reward_id, card_id")
    .in("card_id", cardIds)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as HistoryEntry[];
}

export function describeEntry(e: HistoryEntry, programType: string) {
  const unit = programType === "stamp" ? (Math.abs(e.amount) === 1 ? "Stempel" : "Stempel") : Math.abs(e.amount) === 1 ? "Punkt" : "Punkte";
  if (e.type === "redeem") {
    // Ältere Einlösungen (vor den Buchungsfunktionen) speicherten amount=1
    // ohne Belohnungsbezug - dort keine Menge anzeigen.
    if (!e.reward_id && e.balance_after === null) return { label: "Belohnung eingelöst", delta: null, tone: "accent" as const };
    return { label: e.note ? `Eingelöst: ${e.note}` : "Belohnung eingelöst", delta: `−${e.amount} ${unit}`, tone: "accent" as const };
  }
  if (e.type === "adjust") return { label: e.note || "Korrektur", delta: `${e.amount > 0 ? "+" : ""}${e.amount} ${unit}`, tone: "muted" as const };
  return { label: e.note || (programType === "stamp" ? "Stempel erhalten" : "Punkte erhalten"), delta: `+${e.amount} ${unit}`, tone: "forest" as const };
}
