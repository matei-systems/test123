import { NextResponse } from "next/server";

// TODO (Live): Hier wird ein signierter .pkpass erzeugt und ausgeliefert.
// Nötig: Apple Developer Account, Pass Type ID Zertifikat + WWDR-Zertifikat.
// Bibliothek-Vorschlag: "passkit-generator". Ablauf:
//   1) Karte per ?serial= laden
//   2) pass.json mit Feldern (Stempel/Punkte) + Barcode (serial) füllen
//   3) mit Zertifikat signieren -> .pkpass zurückgeben (Content-Type application/vnd.apple.pkpass)
export async function GET() {
  return NextResponse.json(
    { ok: false, todo: "Apple Wallet: Zertifikate hinterlegen und .pkpass erzeugen." },
    { status: 501 }
  );
}
