import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { appleAuthToken, isAppleWalletConfigured } from "@/lib/apple-wallet";

// Apples PassKit-Webservice-Protokoll: Authentifizierung läuft nicht über
// Supabase Auth (Wallet-Geräte haben keine Session), sondern über ein pro
// Karte deterministisches Token im Authorization-Header, das beim Signieren
// des Passes mit hinterlegt wurde (siehe lib/apple-wallet.ts).
function checkAuth(request: NextRequest, serial: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^ApplePass\s+/i, "");
  const expected = appleAuthToken(serial);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

interface Params {
  deviceLibraryId: string;
  passTypeId: string;
  serial: string;
}

// Registriert ein Gerät für Push-Updates zu dieser Karte.
export async function POST(request: NextRequest, { params }: { params: Params }) {
  if (!isAppleWalletConfigured()) return new NextResponse(null, { status: 501 });
  const { deviceLibraryId, passTypeId, serial } = params;
  if (!checkAuth(request, serial)) return new NextResponse(null, { status: 401 });

  let pushToken: string | undefined;
  try {
    const body = await request.json();
    pushToken = body?.pushToken;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!pushToken) return new NextResponse(null, { status: 400 });

  const admin = createAdminClient();
  const { data: card } = await admin.from("cards").select("org_id").eq("serial_number", serial).maybeSingle();
  if (!card) return new NextResponse(null, { status: 404 });

  const { data: existing } = await admin
    .from("apple_wallet_registrations")
    .select("id")
    .eq("device_library_id", deviceLibraryId)
    .eq("pass_type_identifier", passTypeId)
    .eq("serial_number", serial)
    .maybeSingle();

  if (existing) {
    await admin.from("apple_wallet_registrations").update({ push_token: pushToken }).eq("id", existing.id);
    return new NextResponse(null, { status: 200 });
  }

  const { error } = await admin.from("apple_wallet_registrations").insert({
    device_library_id: deviceLibraryId,
    pass_type_identifier: passTypeId,
    serial_number: serial,
    push_token: pushToken,
    org_id: (card as any).org_id,
  });
  if (error) {
    console.error("[apple-wallet] Geräteregistrierung fehlgeschlagen:", error.message);
    return new NextResponse(null, { status: 500 });
  }
  return new NextResponse(null, { status: 201 });
}

// Entfernt die Registrierung (Pass wurde aus Wallet gelöscht).
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  if (!isAppleWalletConfigured()) return new NextResponse(null, { status: 501 });
  const { deviceLibraryId, passTypeId, serial } = params;
  if (!checkAuth(request, serial)) return new NextResponse(null, { status: 401 });

  const admin = createAdminClient();
  await admin
    .from("apple_wallet_registrations")
    .delete()
    .eq("device_library_id", deviceLibraryId)
    .eq("pass_type_identifier", passTypeId)
    .eq("serial_number", serial);

  return new NextResponse(null, { status: 200 });
}
