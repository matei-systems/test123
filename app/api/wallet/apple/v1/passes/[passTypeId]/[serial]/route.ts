import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDesign, cardTextColor, themeColorHex } from "@/lib/card-design";
import { appleAuthToken, buildApplePass, isAppleWalletConfigured } from "@/lib/apple-wallet";

function checkAuth(request: NextRequest, serial: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^ApplePass\s+/i, "");
  const expected = appleAuthToken(serial);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

// Liefert den aktuellen Stand des Passes - wird von der Wallet-App nach
// einer Push-Benachrichtigung (oder periodisch) aufgerufen, um die neuesten
// Daten zu holen. If-Modified-Since erspart unnötige Neuerzeugung, wenn sich
// die Karte seitdem nicht geändert hat.
// force-dynamic: liest nur den dynamischen Pfad-Parameter, keine
// searchParams/headers zum Zeitpunkt der Cache-Entscheidung - ohne dieses
// Flag würde Next.js den allerersten Pass dauerhaft zwischenspeichern.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { passTypeId: string; serial: string } }) {
  if (!isAppleWalletConfigured()) return new NextResponse(null, { status: 501 });
  const { serial } = params;
  if (!checkAuth(request, serial)) return new NextResponse(null, { status: 401 });

  const admin = createAdminClient();
  const { data: card } = await admin
    .from("cards")
    .select("*, loyalty_programs(*), organizations(name)")
    .eq("serial_number", serial)
    .maybeSingle();
  if (!card) return new NextResponse(null, { status: 404 });

  const updatedAt = new Date((card as any).updated_at);
  const ifModifiedSince = request.headers.get("if-modified-since");
  if (ifModifiedSince) {
    const since = new Date(ifModifiedSince);
    if (!Number.isNaN(since.getTime()) && updatedAt <= since) {
      return new NextResponse(null, { status: 304 });
    }
  }

  const p = (card as any).loyalty_programs;
  const design = resolveDesign(p.design);
  const orgName = (card as any).organizations?.name ?? p.title ?? "Matei Loyalty";

  const buffer = await buildApplePass({
    serial: (card as any).serial_number,
    orgName,
    programTitle: p.title ?? "Treuekarte",
    rewardDescription: p.reward_description ?? "",
    type: p.type,
    stamps: (card as any).stamps,
    stampsRequired: p.stamps_required,
    points: (card as any).points,
    pointsPerReward: p.points_per_reward,
    backgroundColorHex: themeColorHex(design),
    foregroundColorHex: cardTextColor(design),
  });
  if (!buffer) return new NextResponse(null, { status: 500 });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Last-Modified": updatedAt.toUTCString(),
    },
  });
}
