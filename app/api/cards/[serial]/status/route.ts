import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Leichtgewichtiger, öffentlicher Status-Endpunkt für die Web-Kartenseite
// (/c/[serial]): liefert nur die beiden Zahlen, die dort ohnehin schon
// sichtbar sind - keine neue Informationspreisgabe, nur ein günstigerer Weg,
// sie wiederholt abzufragen (kein QR-Code, kein Kartendesign-Lookup nötig).
// Ermöglicht ein automatisches Live-Update der offenen Kartenseite, ohne
// Realtime-Infrastruktur aufzubauen.
//
// export const dynamic ist hier PFLICHT, nicht optional: Route Handlers, die
// nur einen dynamischen Pfad-Parameter lesen (aber keine searchParams/
// headers/cookies), werden von Next.js sonst als statisch behandelt und der
// ALLERERSTE Response dauerhaft zwischengespeichert - jede weitere Anfrage
// hätte für immer denselben (falschen) Stempelstand geliefert, unabhängig
// vom tatsächlichen Datenbankinhalt. Beim Testen genau so aufgefallen.
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { serial: string } }) {
  const admin = createAdminClient();
  const { data: card } = await admin
    .from("cards")
    .select("stamps, points")
    .eq("serial_number", params.serial)
    .maybeSingle();

  if (!card) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(
    { stamps: card.stamps, points: card.points },
    { headers: { "Cache-Control": "no-store" } }
  );
}
