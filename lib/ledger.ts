import type { SupabaseClient } from "@supabase/supabase-js";
import { translateDbError } from "@/lib/db-errors";
import { notifyWalletsOfCardUpdate } from "@/lib/wallet-updates";

// Einziger Weg der App, Salden zu ändern: die Datenbankfunktionen aus
// supabase/p18_platform.sql (earn_on_card, redeem_reward, redeem_with_code,
// create_redemption_request, claim_card). Sie prüfen Mitgliedschaft, Sperre,
// Abo-Status und Guthaben serverseitig unter Zeilensperre und schreiben Saldo
// + Buchungsjournal atomar. Diese Datei übersetzt nur ihre Fehlercodes in
// verständliche Meldungen und stößt nach Erfolg die Wallet-Aktualisierung an.

const MESSAGES: Record<string, string> = {
  MATEI_NOT_AUTHENTICATED: "Bitte melde dich an.",
  MATEI_CARD_NOT_FOUND: "Diese Karte wurde nicht gefunden.",
  MATEI_NOT_MEMBER: "Diese Karte gehört nicht zu deinem Betrieb.",
  MATEI_ORG_SUSPENDED: "Dieser Betrieb ist derzeit gesperrt. Bitte wende dich an den Support.",
  MATEI_BILLING_INACTIVE: "Die Testphase ist abgelaufen oder das Abo ist nicht aktiv – Vergabe und Einlösung sind pausiert.",
  MATEI_CARD_INACTIVE: "Diese Karte ist deaktiviert.",
  MATEI_PROGRAM_INACTIVE: "Dieses Treueprogramm ist gerade pausiert.",
  MATEI_COOLDOWN: "Diese Karte wurde gerade erst gestempelt. Bitte kurz warten (Schutz vor Doppel-Scans).",
  MATEI_AMOUNT_REQUIRED: "Bitte gib den Einkaufsbetrag an.",
  MATEI_BELOW_MINIMUM: "Der Einkaufsbetrag reicht für diese Regel noch nicht aus.",
  MATEI_RULE_MISCONFIGURED: "Die Verdienregel dieses Programms ist unvollständig. Bitte in den Programmeinstellungen prüfen.",
  MATEI_CARD_FULL: "Die Karte ist voll. Bitte zuerst eine Belohnung einlösen.",
  MATEI_REWARD_NOT_FOUND: "Diese Belohnung gehört nicht zu dieser Karte.",
  MATEI_REWARD_INACTIVE: "Diese Belohnung ist pausiert oder beendet.",
  MATEI_REWARD_NOT_YET_VALID: "Diese Belohnung ist noch nicht gültig.",
  MATEI_REWARD_EXPIRED: "Diese Belohnung ist abgelaufen.",
  MATEI_INSUFFICIENT_BALANCE: "Nicht genug Stempel bzw. Punkte für diese Belohnung.",
  MATEI_CODE_INVALID: "Dieser Einlöse-Code ist ungültig oder gehört nicht zu deinem Betrieb.",
  MATEI_CODE_USED: "Dieser Einlöse-Code wurde bereits eingelöst.",
  MATEI_CODE_EXPIRED: "Dieser Einlöse-Code ist abgelaufen. Bitte einen neuen anzeigen lassen.",
  MATEI_ALREADY_CLAIMED: "Diese Karte ist bereits mit einem anderen Konto verknüpft. Wende dich bei Fragen an das Geschäft.",
  MATEI_PROFILE_INCOMPLETE: "Bitte fülle Name, Kategorie, Ort und eine Beschreibung (mindestens 20 Zeichen) aus.",
  MATEI_STATUS_CHANGE_NOT_ALLOWED: "Dieser Statuswechsel ist nicht möglich.",
  MATEI_DEFAULT_REWARD:
    "Die Standard-Belohnung gehört zum Programm und kann nicht gelöscht werden. Ändere sie in den Programmeinstellungen.",
  MATEI_REWARD_HAS_REDEMPTIONS: "Diese Belohnung wurde schon eingelöst und kann nicht gelöscht werden. Beende sie stattdessen.",
  MATEI_PROGRAM_HAS_CARDS: "Für dieses Programm gibt es bereits Karten. Pausiere es stattdessen – so bleiben alle Kundendaten erhalten.",
};

export function ledgerCode(message?: string | null): string | null {
  return message?.match(/MATEI_[A-Z_]+/)?.[0] ?? null;
}

export function ledgerError(message?: string | null): string {
  const code = ledgerCode(message);
  if (code && MESSAGES[code]) return MESSAGES[code];
  if ((message ?? "").toLowerCase().includes("permission denied")) return "Dafür fehlt dir die Berechtigung.";
  return translateDbError(message);
}

export interface EarnResult {
  duplicate: boolean;
  transaction_id: string;
  units: number;
  factor: number;
  balance: number;
  type: "stamp" | "points";
  card_id: string;
}

export interface RedeemResult {
  duplicate: boolean;
  transaction_id: string;
  redemption_id?: string;
  cost: number;
  balance: number;
  reward_title?: string;
  type?: "stamp" | "points";
  card_id: string;
  request_id?: string;
}

type Outcome<T> = { ok: true; data: T } | { ok: false; error: string; code: string | null };

async function call<T>(db: SupabaseClient, fn: string, args: Record<string, unknown>): Promise<Outcome<T>> {
  const { data, error } = await db.rpc(fn, args);
  if (error) return { ok: false, error: ledgerError(error.message), code: ledgerCode(error.message) };
  return { ok: true, data: data as T };
}

export async function earnOnCard(db: SupabaseClient, cardId: string, purchaseAmount?: number | null, requestId?: string | null) {
  const res = await call<EarnResult>(db, "earn_on_card", {
    p_card_id: cardId,
    p_purchase_amount: purchaseAmount ?? null,
    p_client_request_id: requestId || null,
  });
  if (res.ok && !res.data.duplicate) notifyWalletsOfCardUpdate(cardId).catch(() => {});
  return res;
}

export async function redeemReward(db: SupabaseClient, cardId: string, rewardId: string, requestId?: string | null) {
  const res = await call<RedeemResult>(db, "redeem_reward", {
    p_card_id: cardId,
    p_reward_id: rewardId,
    p_client_request_id: requestId || null,
  });
  if (res.ok && !res.data.duplicate) notifyWalletsOfCardUpdate(cardId).catch(() => {});
  return res;
}

export async function redeemWithCode(db: SupabaseClient, code: string, requestId?: string | null) {
  const res = await call<RedeemResult>(db, "redeem_with_code", { p_code: code, p_client_request_id: requestId || null });
  if (res.ok && !res.data.duplicate) notifyWalletsOfCardUpdate(res.data.card_id).catch(() => {});
  return res;
}

export async function createRedemptionRequest(db: SupabaseClient, cardId: string, rewardId: string) {
  return call<{ token: string; short_code: string; expires_at: string; reward_title: string; cost: number }>(
    db,
    "create_redemption_request",
    { p_card_id: cardId, p_reward_id: rewardId }
  );
}

export async function claimCard(db: SupabaseClient, serial: string) {
  return call<{ card_id: string; org_id: string }>(db, "claim_card", { p_serial: serial });
}

// Akzeptiert die Karten-URL aus dem QR-Code (<app>/c/<serial>) oder die
// nackte Seriennummer; liefert nur das letzte Pfadsegment.
export function serialFromInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    return trimmed.replace(/^\/?c\//, "") || null;
  }
}
