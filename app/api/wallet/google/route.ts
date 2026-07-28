import { NextResponse } from "next/server";

// TODO (Live): Google Wallet API. Nötig: Google-Cloud-Projekt + Service Account.
// Ablauf: LoyaltyClass einmalig anlegen -> pro Karte ein LoyaltyObject ->
// signiertes JWT erzeugen -> Weiterleitung auf https://pay.google.com/gp/v/save/<jwt>
export async function GET() {
  return NextResponse.json(
    { ok: false, todo: "Google Wallet: Service Account + signiertes JWT einrichten." },
    { status: 501 }
  );
}
