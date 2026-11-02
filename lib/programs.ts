// Anzeige-Helfer für Programme, Belohnungen, Aktionen und Buchungen.
// Die Texte spiegeln exakt die serverseitige Logik in earn_on_card()
// (supabase/p18_platform.sql): manuell 1 Stempel bzw. 10 Punkte je Scan,
// nach Betrag ab Mindestbetrag 1 Stempel bzw. 1 Punkt je X €.

export type ProgramType = "stamp" | "points";

export interface ProgramLike {
  type: ProgramType | string;
  stamps_required?: number | null;
  points_per_reward?: number | null;
  earning_mode?: string | null;
  min_purchase_amount?: number | string | null;
  amount_per_point?: number | string | null;
}

const euro = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });
export function fmtEuro(v: number | string | null | undefined) {
  const n = Number(v);
  return Number.isFinite(n) ? euro.format(n) : "";
}

export function unitName(type: string, n: number) {
  if (type === "stamp") return n === 1 ? "Stempel" : "Stempel";
  return n === 1 ? "Punkt" : "Punkte";
}

export function costText(type: string, cost: number) {
  return `${cost} ${unitName(type, cost)}`;
}

export function earningRuleText(p: ProgramLike) {
  if (p.type === "stamp") {
    if (p.earning_mode === "amount" && Number(p.min_purchase_amount) > 0) {
      return `1 Stempel pro Einkauf ab ${fmtEuro(p.min_purchase_amount)}`;
    }
    return "1 Stempel pro Einkauf";
  }
  if (p.earning_mode === "amount" && Number(p.amount_per_point) > 0) {
    return `1 Punkt je ${fmtEuro(p.amount_per_point)} Einkaufswert`;
  }
  return "10 Punkte pro Einkauf";
}

export function programTypeLabel(type: string) {
  return type === "stamp" ? "Stempelkarte" : "Punktekarte";
}

export function balanceOf(card: { stamps?: number | null; points?: number | null }, type: string) {
  return type === "stamp" ? Number(card.stamps ?? 0) : Number(card.points ?? 0);
}

const dateFmt = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
export function fmtDate(v: string | null | undefined) {
  return v ? dateFmt.format(new Date(v)) : "";
}
export function fmtDateTime(v: string | null | undefined) {
  return v ? dateTimeFmt.format(new Date(v)) : "";
}

export function multiplierFactor(config: unknown): number {
  const raw = (config as any)?.factor;
  const n = typeof raw === "number" ? raw : /^[0-9]+$/.test(String(raw ?? "")) ? Number(raw) : 1;
  return Math.max(1, Math.min(5, Math.trunc(n)));
}

export function campaignText(c: { type: string; config?: unknown; starts_at?: string | null; ends_at?: string | null }) {
  const period =
    c.starts_at && new Date(c.starts_at).getTime() > Date.now()
      ? `ab ${fmtDate(c.starts_at)}${c.ends_at ? ` bis ${fmtDate(c.ends_at)}` : ""}`
      : c.ends_at
        ? `bis ${fmtDate(c.ends_at)}`
        : "";
  if (c.type === "multiplier") return `×${multiplierFactor(c.config)} auf jede Buchung${period ? ` · ${period}` : ""}`;
  return period;
}

// Sichere externe Links aus Profilangaben (nur http/https, kein javascript:)
export function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim();
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withProto);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function instagramUrl(handle: string | null | undefined): string | null {
  if (!handle) return null;
  const h = handle.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? `https://www.instagram.com/${h}/` : null;
}
