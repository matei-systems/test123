import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDesign, themeColorHex, type CardDesign } from "@/lib/card-design";
import { isGoogleWalletConfigured, patchGoogleLoyaltyPoints, upsertGoogleLoyaltyObject, type GoogleObjectInput } from "@/lib/google-wallet";
import { isAppleWalletConfigured, sendApplePushNotifications } from "@/lib/apple-wallet";
import { renderWalletHero } from "@/lib/card-render";

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

async function loadWalletCardInput(cardId: string): Promise<{ input: GoogleObjectInput; design: CardDesign } | null> {
  const admin = createAdminClient();
  const { data: card } = await admin
    .from("cards")
    .select("serial_number, stamps, points, program_id, loyalty_programs(title, name, type, stamps_required, points_per_reward, reward_description, design), organizations(name)")
    .eq("id", cardId)
    .maybeSingle();
  if (!card) return null;

  const p = (card as any).loyalty_programs;
  const design = resolveDesign(p?.design);
  const input: GoogleObjectInput = {
    programId: (card as any).program_id,
    serial: (card as any).serial_number,
    orgName: (card as any).organizations?.name ?? p?.title ?? "Matei Loyalty",
    programTitle: p?.title ?? p?.name ?? "Treuekarte",
    rewardDescription: p?.reward_description ?? "",
    type: p?.type ?? "stamp",
    stamps: (card as any).stamps,
    stampsRequired: p?.stamps_required ?? 10,
    points: (card as any).points,
    pointsPerReward: p?.points_per_reward ?? 100,
    themeColorHex: themeColorHex(design),
  };
  return { input, design };
}

// Rendert das Hero-/Stempel-Bild (siehe lib/card-render.ts) und lädt es
// unter einem stabilen, aber versionierten Pfad in den bestehenden
// "card-assets"-Storage-Bucket hoch. Google Wallet kann Bilder nur per
// öffentlich erreichbarer URL beziehen (kein Datei-Upload über die API) -
// die Versionsnummer im Pfad sorgt dafür, dass weder Googles noch ein
// zwischengeschalteter CDN-Cache jemals eine veraltete Kartenansicht
// ausliefert, obwohl der Dateiname sich sonst pro Karte nie ändern würde.
// Wird nie geworfen - ein Fehler hier darf das Stempeln selbst nicht stören,
// die Karte bekommt beim nächsten Update einfach erneut eine Chance.
export async function renderAndUploadHero(
  serial: string,
  design: CardDesign,
  type: "stamp" | "points",
  stamps: number,
  stampsRequired: number,
  points: number,
  pointsPerReward: number
): Promise<string | null> {
  try {
    const buffer = await renderWalletHero({ design, type, stamps, stampsRequired, points, pointsPerReward });
    const admin = createAdminClient();
    const path = `wallet-hero/${serial}.png`;
    const { error } = await admin.storage.from("card-assets").upload(path, buffer, {
      contentType: "image/png",
      upsert: true,
    });
    if (error) {
      console.error("[wallet-updates] Hero-Bild-Upload fehlgeschlagen:", error.message);
      return null;
    }
    const { data } = admin.storage.from("card-assets").getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  } catch (e: any) {
    console.error("[wallet-updates] Hero-Bild-Rendering fehlgeschlagen:", e.message);
    return null;
  }
}

// Wird nach jedem Stempel/jeder Punktevergabe/jeder Einlösung aufgerufen -
// aktualisiert beide Wallets, falls konfiguriert. Schlägt niemals fehl nach
// außen: ein Ausfall von Google/Apple darf das Stempeln selbst nie verzögern
// oder verhindern (deshalb der äußere try/catch zusätzlich zu den bereits
// in google-wallet.ts/apple-wallet.ts eingebauten Absicherungen).
export async function notifyWalletsOfCardUpdate(cardId: string): Promise<void> {
  if (!isGoogleWalletConfigured() && !isAppleWalletConfigured()) return;
  try {
    const loaded = await loadWalletCardInput(cardId);
    if (!loaded) return;
    const { input, design } = loaded;

    // Apple braucht hier keinen Bild-Render: der Pass wird bei jedem Abruf
    // über den PassKit-Webservice frisch aus dem aktuellen DB-Stand gebaut
    // (siehe buildApplePass) - die Push-Benachrichtigung weckt die Wallet-App
    // nur zum erneuten Abrufen auf. Google dagegen braucht eine fertige
    // Bild-URL im PATCH selbst, deshalb hier vorab rendern + hochladen.
    const heroImageUrl = isGoogleWalletConfigured()
      ? await renderAndUploadHero(input.serial, design, input.type, input.stamps, input.stampsRequired, input.points, input.pointsPerReward)
      : null;

    await Promise.allSettled([
      isGoogleWalletConfigured() ? patchGoogleLoyaltyPoints({ ...input, heroImageUrl }) : Promise.resolve(),
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
    const loaded = await loadWalletCardInput(cardId);
    if (!loaded) return;
    const { input, design } = loaded;
    const heroImageUrl = await renderAndUploadHero(
      input.serial,
      design,
      input.type,
      input.stamps,
      input.stampsRequired,
      input.points,
      input.pointsPerReward
    );
    await upsertGoogleLoyaltyObject({ ...input, heroImageUrl });
  } catch (e: any) {
    console.error("[wallet-updates] Objekt-Anlage fehlgeschlagen:", e.message);
  }
}
