import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDesign, cardTextColor, themeColorHex } from "@/lib/card-design";
import { buildApplePass, isAppleWalletConfigured } from "@/lib/apple-wallet";

// "Zu Apple Wallet hinzufügen": liefert die fertig signierte .pkpass-Datei
// direkt aus - Safari/iOS erkennen den Content-Type automatisch und bieten
// "Zu Wallet hinzufügen" an. Bleibt inaktiv (501), bis die Zertifikate
// hinterlegt sind.
// force-dynamic: sonst würde Next.js den allerersten erzeugten Pass
// dauerhaft zwischenspeichern und immer denselben (veralteten) Stempelstand
// ausliefern - siehe ausführlicher Kommentar in api/cards/[serial]/status.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAppleWalletConfigured()) {
    return NextResponse.json(
      { ok: false, todo: "Apple Wallet: Zertifikate hinterlegen, um .pkpass zu erzeugen." },
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

  if (!buffer) {
    return NextResponse.json({ ok: false, error: "Pass konnte nicht erstellt werden." }, { status: 500 });
  }

  await admin.from("cards").update({ apple_pass_serial: (card as any).serial_number }).eq("id", (card as any).id);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="${serial}.pkpass"`,
    },
  });
}
