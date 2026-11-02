import { createAnonClient } from "@/lib/supabase/anon";

// Öffentliches Geschäftsverzeichnis: Typen, Kategorien, Öffnungszeiten und
// Abfragen. Alle Abfragen laufen über den Anon-Client - welche Betriebe
// sichtbar sind, entscheidet ausschließlich die Datenbank (RLS-Policy
// bp_public_select: freigeschaltet + gelistet + nicht gesperrt + Abo aktiv).

export const CATEGORIES = {
  cafe: "Café",
  baeckerei: "Bäckerei",
  restaurant: "Restaurant",
  friseur: "Friseur",
  kosmetik: "Kosmetik & Wellness",
  einzelhandel: "Einzelhandel",
  fitness: "Fitness & Sport",
  sonstiges: "Sonstiges",
} as const;
export type Category = keyof typeof CATEGORIES;

export function categoryLabel(c: string | null | undefined) {
  return (c && (CATEGORIES as Record<string, string>)[c]) || "Geschäft";
}

export const WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"] as const;

// opening_hours: [{ day: 0-6 (Mo-So), closed: bool, open: "08:00", close: "18:00" }]
export interface OpeningHour {
  day: number;
  closed: boolean;
  open?: string;
  close?: string;
}

export function normalizeHours(raw: unknown): OpeningHour[] {
  const list = Array.isArray(raw) ? raw : [];
  return WEEKDAYS.map((_, day) => {
    const h = list.find((x: any) => x && Number(x.day) === day) as any;
    const valid = (t: unknown) => typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
    if (!h || h.closed || !valid(h.open) || !valid(h.close)) return { day, closed: true };
    return { day, closed: false, open: h.open, close: h.close };
  });
}

export function hasAnyHours(raw: unknown) {
  return normalizeHours(raw).some((h) => !h.closed);
}

export interface PublicBusiness {
  org_id: string;
  slug: string;
  display_name: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  logo_url: string | null;
  cover_url: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  website: string | null;
  phone: string | null;
  public_email: string | null;
  instagram: string | null;
  opening_hours: unknown;
  hours_note: string | null;
}

const PUBLIC_COLUMNS =
  "org_id, slug, display_name, tagline, description, category, logo_url, cover_url, address, postal_code, city, website, phone, public_email, instagram, opening_hours, hours_note";

export async function listPublicBusinesses(opts: { q?: string; category?: string; city?: string; limit?: number } = {}) {
  const db = createAnonClient();
  let query = db
    .from("business_profiles")
    .select(PUBLIC_COLUMNS, { count: "exact" })
    .eq("listing_status", "approved")
    .eq("is_listed", true)
    .order("display_name", { ascending: true })
    .limit(opts.limit ?? 60);

  if (opts.category && opts.category in CATEGORIES) query = query.eq("category", opts.category);
  if (opts.city) query = query.ilike("city", opts.city.replace(/[%_]/g, ""));
  if (opts.q) {
    // Nur Buchstaben/Ziffern/Leerzeichen/Bindestrich - verhindert, dass
    // Sonderzeichen den PostgREST-or()-Filter verändern.
    const term = opts.q.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 60);
    if (term) query = query.or(`display_name.ilike.%${term}%,tagline.ilike.%${term}%,description.ilike.%${term}%,city.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) return { businesses: [] as PublicBusiness[], total: 0, error: error.message };
  return { businesses: (data ?? []) as PublicBusiness[], total: count ?? 0, error: null };
}

export async function listPublicCities() {
  const db = createAnonClient();
  const { data } = await db.from("business_profiles").select("city").eq("listing_status", "approved").eq("is_listed", true);
  const cities = new Map<string, string>();
  for (const row of data ?? []) {
    const c = (row as any).city?.trim();
    if (c) cities.set(c.toLowerCase(), c);
  }
  return Array.from(cities.values()).sort((a, b) => a.localeCompare(b, "de"));
}

export async function getPublicBusiness(slug: string) {
  const db = createAnonClient();
  const { data: business } = await db
    .from("business_profiles")
    .select(PUBLIC_COLUMNS)
    .eq("slug", slug)
    .eq("listing_status", "approved")
    .eq("is_listed", true)
    .maybeSingle();
  if (!business) return null;

  const orgId = (business as any).org_id as string;
  const [programs, rewards, campaigns, locations] = await Promise.all([
    db
      .from("loyalty_programs")
      .select("id, name, title, type, stamps_required, points_per_reward, reward_description, earning_mode, min_purchase_amount, amount_per_point")
      .eq("org_id", orgId)
      .eq("active", true)
      .order("created_at", { ascending: true }),
    db
      .from("rewards")
      .select("id, program_id, title, description, cost_points, conditions, valid_from, valid_until, is_default, sort_order")
      .eq("org_id", orgId)
      .eq("active", true)
      .is("ended_at", null)
      .order("sort_order", { ascending: true })
      .order("cost_points", { ascending: true }),
    db
      .from("campaigns")
      .select("id, program_id, name, description, type, config, starts_at, ends_at")
      .eq("org_id", orgId)
      .eq("active", true)
      .order("starts_at", { ascending: true, nullsFirst: true }),
    db.from("locations").select("id, name, address, postal_code, city").eq("org_id", orgId),
  ]);

  const now = Date.now();
  return {
    business: business as PublicBusiness,
    programs: (programs.data ?? []) as any[],
    rewards: ((rewards.data ?? []) as any[]).filter((r) => !r.valid_until || new Date(r.valid_until).getTime() > now),
    campaigns: ((campaigns.data ?? []) as any[]).filter(
      (c) => (!c.ends_at || new Date(c.ends_at).getTime() > now) && (!c.starts_at || new Date(c.starts_at).getTime() <= now + 30 * 86400000)
    ),
    locations: (locations.data ?? []) as any[],
  };
}

export function initials(name: string) {
  return (name.trim().match(/\p{L}|\p{N}/u)?.[0] ?? "?").toUpperCase();
}
