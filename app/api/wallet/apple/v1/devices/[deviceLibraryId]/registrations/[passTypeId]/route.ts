import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAppleWalletConfigured } from "@/lib/apple-wallet";

// Apple fragt periodisch: "welche Karten dieses Geräts haben sich seit dem
// letzten Tag geändert?" - hier reicht als einfacher "Tag" der Zeitpunkt der
// letzten Kartenänderung (cards.updated_at), keine eigene Versionstabelle
// nötig. Ohne Authorization-Header (Apple schickt hier keinen), aber nur für
// bereits registrierte Geräte relevant.
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { deviceLibraryId: string; passTypeId: string } }
) {
  if (!isAppleWalletConfigured()) return new NextResponse(null, { status: 501 });
  const { deviceLibraryId, passTypeId } = params;
  const since = request.nextUrl.searchParams.get("passesUpdatedSince");

  const admin = createAdminClient();
  const { data: regs } = await admin
    .from("apple_wallet_registrations")
    .select("serial_number")
    .eq("device_library_id", deviceLibraryId)
    .eq("pass_type_identifier", passTypeId);

  if (!regs || regs.length === 0) return new NextResponse(null, { status: 204 });

  const serials = regs.map((r: any) => r.serial_number);
  let query = admin.from("cards").select("serial_number, updated_at").in("serial_number", serials);
  if (since) query = query.gt("updated_at", since);

  const { data: cards } = await query;
  if (!cards || cards.length === 0) return new NextResponse(null, { status: 204 });

  const lastUpdated = cards.reduce(
    (max: string, c: any) => (c.updated_at > max ? c.updated_at : max),
    cards[0].updated_at
  );

  return NextResponse.json({
    serialNumbers: cards.map((c: any) => c.serial_number),
    lastUpdated,
  });
}
