import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Für Uptime-Monitoring (z. B. Vercel-eigenes Monitoring, UptimeRobot,
// Better Uptime) - bewusst öffentlich ohne Auth, liefert aber nur ein
// Boolesches "erreichbar/nicht erreichbar" plus Zeitstempel, keine
// internen Details. Prüft die Datenbank mit einer minimalen Head-Count-
// Anfrage (kein Datentransfer), damit ein "ok" auch wirklich bedeutet,
// dass die App End-to-End funktionsfähig ist, nicht nur, dass der
// Next.js-Server antwortet.
export async function GET() {
  const startedAt = Date.now();
  try {
    const db = createAdminClient();
    const { error } = await db.from("organizations").select("id", { count: "exact", head: true }).limit(1);
    if (error) throw error;
    return NextResponse.json({
      status: "ok",
      database: "reachable",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    // Temporär (P16-Deployment-Debugging): echte Fehlerursache in den
    // Vercel-Runtime-Logs sichtbar machen, statt sie zu verschlucken -
    // danach wieder auf die schlanke Fassung zurücksetzen.
    console.error("[health] Datenbank nicht erreichbar:", e?.message, e?.cause ?? e);
    return NextResponse.json(
      { status: "error", database: "unreachable", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
