import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDesign, themeColorHex } from "@/lib/card-design";
import { buildGoogleWalletSaveUrl, upsertGoogleLoyaltyObject, isGoogleWalletConfigured } from "@/lib/google-wallet";

// Google Wallet: Klasse + Objekt werden inline im signierten JWT mitgeschickt,
// daher genügt hier ein Redirect auf https://pay.google.com/gp/v/save/<jwt>.
// Bleibt inaktiv (501), bis GOOGLE_WALLET_* Variablen gesetzt sind.
// force-dynamic: der JWT enthält den aktuellen Stempelstand - ohne das würde
// Next.js den allerersten Save-Link dauerhaft zwischenspeichern.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isGoogleWalletConfigured()) {
    return NextResponse.json(
      { ok: false, todo: "Google Wallet: Service Account + signiertes JWT einrichten." },
      { status: 501 }
    );
  }

  const serial = request.nextUrl.searchParams.get("serial");
  if (!serial) {
    return NextResponse.json({ ok: false, error: "serial fehlt" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: card } = await admin
    .from("cards")
    .select("*, loyalty_programs(*), organizations(name)")
    .eq("serial_number", serial)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ ok: false, error: "Karte nicht gefunden" }, { status: 404 });
  }

  const p = (card as any).loyalty_programs;
  const design = resolveDesign(p.design);
  const orgName = (card as any).organizations?.name ?? p.title ?? "Matei Loyalty";

  const objectInput = {
    programId: p.id as string,
    serial: (card as any).serial_number as string,
    orgName,
    rewardDescription: p.reward_description ?? "",
    type: p.type as "stamp" | "points",
    stamps: (card as any).stamps as number,
    stampsRequired: p.stamps_required as number,
    points: (card as any).points as number,
    pointsPerReward: p.points_per_reward as number,
    themeColorHex: themeColorHex(design),
  };

  // Objekt proaktiv anlegen/aktualisieren, damit es beim Speichern bereits
  // existiert (relevant falls die Karte vorher noch nie ausgegeben/upserted
  // wurde) - Fehler hier dürfen den Save-Link nicht verhindern.
  upsertGoogleLoyaltyObject(objectInput).catch(() => {});

  const saveUrl = buildGoogleWalletSaveUrl(objectInput);

  if (!saveUrl) {
    return NextResponse.json(
      { ok: false, todo: "Google Wallet: Service Account + signiertes JWT einrichten." },
      { status: 501 }
    );
  }

  return NextResponse.redirect(saveUrl);
}
