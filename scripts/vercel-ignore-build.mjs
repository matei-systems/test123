// Vercel "Ignored Build Step" (vercel.json -> ignoreCommand).
// Exit 0 = Build überspringen, Exit 1 = bauen.
//
// Zweck: Diese App-Version braucht die Datenbank-Migration P18
// (supabase/p18_platform.sql: business_profiles, Buchungsfunktionen ...).
// Ein Push auf den Produktions-Branch würde sonst sofort live gehen, auch
// wenn die Migration noch nicht eingespielt ist - Scannen und Einlösen wären
// dann kaputt. Das Skript fragt mit dem ÖFFENTLICHEN Schlüssel ab, ob Tabelle
// und Funktion existieren, und überspringt den Build NUR, wenn sicher
// feststeht, dass sie fehlen. Bei Netzwerkproblemen oder fehlenden Variablen
// wird normal gebaut (kein Blockieren aus anderen Gründen).
// Rückfallwerte = öffentliche Projekt-URL und Publishable-Key (stecken ohnehin
// in jedem ausgelieferten Browser-Bundle, keine Geheimnisse) - falls Vercel
// die Projektvariablen im Ignored Build Step nicht bereitstellt.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gmhjqspgesewkgvnwvaz.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_kJJdIpqwOIamJjJIheW4FA_5p9hzflo";

async function missing(path, init) {
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: key, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status !== 404) return false;
  const body = await res.json().catch(() => ({}));
  return body?.code === "PGRST205" || body?.code === "PGRST202";
}

try {
  if (!url || !key) {
    console.log("[ignore-build] Supabase-Variablen fehlen - baue normal.");
    process.exit(1);
  }
  const tableMissing = await missing("/rest/v1/business_profiles?select=org_id&limit=1");
  const rpcMissing = await missing("/rest/v1/rpc/earn_on_card", {
    method: "POST",
    body: JSON.stringify({ p_card_id: "00000000-0000-0000-0000-000000000000" }),
  });
  if (tableMissing || rpcMissing) {
    console.log("[ignore-build] Migration P18 ist noch NICHT in der Datenbank - Build übersprungen, die aktuelle Version bleibt online.");
    console.log("[ignore-build] Bitte supabase/p18_platform.sql einspielen und dann erneut deployen.");
    process.exit(0);
  }
  console.log("[ignore-build] Migration P18 vorhanden - baue.");
  process.exit(1);
} catch (e) {
  console.log("[ignore-build] Prüfung nicht möglich (" + (e?.message ?? e) + ") - baue normal.");
  process.exit(1);
}
