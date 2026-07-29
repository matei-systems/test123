import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDesign, themeColorHex } from "@/lib/card-design";
import { isGoogleWalletConfigured, patchGoogleLoyaltyPoints, upsertGoogleLoyaltyObject, type GoogleObjectInput } from "@/lib/google-wallet";
import { isAppleWalletConfigured, sendApplePushNotifications } from "@/lib/apple-wallet";

// Wichtig für alle Aufrufer: diese beiden Funktionen werden überall bewusst
// OHNE await aufgerufen ("Feuer und vergessen"). Next.js 14 hat noch kein
// after()/waitUntil() (das kam erst mit Next.js 15) - ein synchron
// awaiteter Aufruf hier würde die Stempel-Vergabe für das Personal um bis
// zu den unten stehenden Timeouts (5-6s) verzögern, sobald echte Google-/
// Apple-Zugangsdaten hinterlegt sind. Das würde das Ziel "gesamter Ablauf
// unter 5 Sekunden" direkt verletzen. Die Kartenänderung selbst (DB-Schreibung)
// ist zu diesem Zeitpunkt bereits abgeschlossen - nur die Wallet-Synchronisierung
// läuft im Hintergrund weiter, während die Server Action dem Personal längst
// eine Antwort geschickt hat.

async function loadWalletCardInput(cardId: string): Promise<GoogleObjectInput | null> {
  const admin = createAdminClient();
  const { data: card } = await admin
    .from("cards")
    .select("serial_number, stamps, points, program_id, loyalty_programs(title, name, type, stamps_required, points_per_reward, reward_description, design), organizations(name)")
    .eq("id", cardId)
    .maybeSingle();
  if (!card) return null;

  const p = (card as any).loyalty_programs;
  const design = resolveDesign(p?.design);
  return {
    programId: (card as any).program_id,
    serial: (card as any).serial_number,
    orgName: (card as any).organizations?.name ?? p?.title ?? "Matei Loyalty",
    rewardDescription: p?.reward_description ?? "",
    type: p?.type ?? "stamp",
    stamps: (card as any).stamps,
    stampsRequired: p?.stamps_required ?? 10,
    points: (card as any).points,
    pointsPerReward: p?.points_per_reward ?? 100,
    themeColorHex: themeColorHex(design),
  };
}

// Wird nach jedem Stempel/jeder Punktevergabe/jeder Einlösung aufgerufen -
// aktualisiert beide Wallets, falls konfiguriert. Schlägt niemals fehl nach
// außen: ein Ausfall von Google/Apple darf das Stempeln selbst nie verzögern
// oder verhindern (deshalb der äußere try/catch zusätzlich zu den bereits
// in google-wallet.ts/apple-wallet.ts eingebauten Absicherungen).
export async function notifyWalletsOfCardUpdate(cardId: string): Promise<void> {
  if (!isGoogleWalletConfigured() && !isAppleWalletConfigured()) return;
  try {
    const input = await loadWalletCardInput(cardId);
    if (!input) return;
    await Promise.allSettled([
      isGoogleWalletConfigured() ? patchGoogleLoyaltyPoints(input) : Promise.resolve(),
      isAppleWalletConfigured() ? sendApplePushNotifications(input.serial) : Promise.resolve(),
    ]);
  } catch (e: any) {
    console.error("[wallet-updates] Aktualisierung fehlgeschlagen:", e.message);
  }
}

// Wird aufgerufen, sobald eine neue Karte ausgegeben wird (manuell oder per
// Selbstanmeldung) - legt das Google-Wallet-Objekt proaktiv an, damit spätere
// Updates auch dann funktionieren, wenn der Kunde die Karte noch nicht selbst
// gespeichert hat. Apple braucht hier nichts: der Pass entsteht erst beim
// Download/Abruf, es gibt nichts, das man vorab anlegen müsste.
export async function registerWalletObjectsForNewCard(cardId: string): Promise<void> {
  if (!isGoogleWalletConfigured()) return;
  try {
    const input = await loadWalletCardInput(cardId);
    if (!input) return;
    await upsertGoogleLoyaltyObject(input);
  } catch (e: any) {
    console.error("[wallet-updates] Objekt-Anlage fehlgeschlagen:", e.message);
  }
}
