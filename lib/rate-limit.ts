import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

// Postgres-basiertes Sliding-Window-Rate-Limit statt Redis/Upstash - siehe
// Kommentar in supabase/schema.sql (P15-Abschnitt). Für Auth-Endpunkte
// (Login, Registrierung, Passwort-Reset) völlig ausreichend: die Anzahl der
// Anfragen ist um Größenordnungen kleiner als bei den eigentlichen
// Kernfunktionen der Plattform (Stempeln/Scannen), ein zusätzlicher
// In-Memory-Store lohnt sich hier nicht.
//
// identifier ist standardmäßig die Client-IP (aus x-forwarded-for, wie sie
// Vercel/die meisten Reverse-Proxys setzen) - IP-basiert statt E-Mail-
// basiert, damit niemand einen fremden Account durch gezielte Fehlversuche
// aussperren kann (ein Angreifer kennt oft die E-Mail des Opfers, aber
// nicht dieselbe IP).
export async function checkRateLimit(
  scope: string,
  opts: { max: number; windowSeconds: number; identifier?: string }
): Promise<RateLimitResult> {
  const identifier = opts.identifier ?? getClientIp();
  const key = `${scope}:${identifier}`;
  const windowStart = new Date(Date.now() - opts.windowSeconds * 1000).toISOString();

  const db = createAdminClient();

  // Alte Einträge für genau diesen Schlüssel gleich mit aufräumen - hält
  // die Tabelle beschränkt, ohne einen separaten Cron-Job zu brauchen.
  await db.from("rate_limit_events").delete().eq("key", key).lt("created_at", windowStart);

  const { count } = await db
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", windowStart);

  if ((count ?? 0) >= opts.max) {
    return { allowed: false, retryAfterSeconds: opts.windowSeconds };
  }

  await db.from("rate_limit_events").insert({ key });
  return { allowed: true };
}

function getClientIp(): string {
  const h = headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
