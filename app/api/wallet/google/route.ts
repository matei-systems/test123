import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { THEMES } from "@/lib/themes";
import { buildGoogleWalletSaveUrl, isGoogleWalletConfigured } from "@/lib/google-wallet";

// Google Wallet: Klasse + Objekt werden inline im signierten JWT mitgeschickt,
// daher genügt hier ein Redirect auf https://pay.google.com/gp/v/save/<jwt>.
// Bleibt inaktiv (501), bis GOOGLE_WALLET_* Variablen gesetzt sind.
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
  const theme = THEMES[p.design?.theme ?? 0] ?? THEMES[0];

  const saveUrl = buildGoogleWalletSaveUrl({
    serial: (card as any).serial_number,
    orgName: (card as any).organizations?.name ?? p.title ?? "Matei Loyalty",
    programTitle: p.title ?? "Treuekarte",
    rewardDescription: p.reward_description ?? "",
    type: p.type,
    stamps: (card as any).stamps,
    stampsRequired: p.stamps_required,
    points: (card as any).points,
    pointsPerReward: p.points_per_reward,
    themeColorHex: theme.from,
  });

  if (!saveUrl) {
    return NextResponse.json(
      { ok: false, todo: "Google Wallet: Service Account + signiertes JWT einrichten." },
      { status: 501 }
    );
  }

  return NextResponse.redirect(saveUrl);
}
