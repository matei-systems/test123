import { NextRequest, NextResponse } from "next/server";

// Apple Wallet schickt hierher Client-seitige Fehlermeldungen (z. B. wenn ein
// Pass nicht geladen werden konnte). Kein Auth-Header vorgesehen - laut
// Spezifikation offen für jedes Gerät. Nur zu Diagnosezwecken protokolliert.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const logs: string[] = Array.isArray(body?.logs) ? body.logs : [];
    for (const line of logs) console.log("[apple-wallet] Geräte-Log:", line);
  } catch {
    // Ungültiger Body - einfach ignorieren, Apple erwartet trotzdem 200.
  }
  return new NextResponse(null, { status: 200 });
}
