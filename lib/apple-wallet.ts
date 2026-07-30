import { PKPass } from "passkit-generator";
import { createHmac } from "crypto";
import http2 from "http2";
import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { hexToRgbString } from "@/lib/contrast";
import { renderWalletHero, downscalePng, renderContainedImage } from "@/lib/card-render";
import { resolveDesign, type CardDesign } from "@/lib/card-design";

// Apple Wallet braucht ein aktives Apple-Developer-Programm, eine Pass-Type-ID
// mit zugehörigem Zertifikat sowie das Apple-WWDR-Zwischenzertifikat - das
// kann nur der Kontoinhaber selbst beantragen/exportieren. Bis alle
// Variablen gesetzt sind, bleibt die Integration inaktiv. Der Code ist
// fertig und wird automatisch scharf, sobald die Zertifikate hinterlegt sind.
export function isAppleWalletConfigured(): boolean {
  return Boolean(
    process.env.APPLE_TEAM_IDENTIFIER &&
      process.env.APPLE_PASS_TYPE_IDENTIFIER &&
      process.env.APPLE_WWDR_CERTIFICATE &&
      process.env.APPLE_PASS_SIGNER_CERT &&
      process.env.APPLE_PASS_SIGNER_KEY &&
      process.env.APPLE_PASS_AUTH_SECRET
  );
}

function pem(name: string): string {
  return (process.env[name] ?? "").replace(/\\n/g, "\n");
}

// Pro Karte ein eigenes Token, das Apples PassKit-Webservice bei jeder
// Anfrage im "Authorization: ApplePass <token>"-Header mitschickt - so kann
// verifiziert werden, dass eine Registrierungs-/Update-Anfrage wirklich zu
// dieser Karte gehört, ohne dafür eine eigene Zufalls-Tabelle pflegen zu
// müssen (das Token ist über den Serial deterministisch nachrechenbar).
export function appleAuthToken(serial: string): string {
  return createHmac("sha256", process.env.APPLE_PASS_AUTH_SECRET ?? "").update(serial).digest("hex");
}

const ICON_DIR = path.join(process.cwd(), "assets", "wallet");

export interface ApplePassInput {
  serial: string;
  orgName: string;
  programTitle: string;
  rewardDescription: string;
  type: "stamp" | "points";
  stamps: number;
  stampsRequired: number;
  points: number;
  pointsPerReward: number;
  backgroundColorHex: string;
  foregroundColorHex: string;
  design: CardDesign | Record<string, any>;
}

// Rendert icon.png/@2x/@3x (Pflichtfeld, u.a. für Sperrbildschirm/Push-
// Benachrichtigungen) sowie logo.png/@2x/@3x (sichtbar oben auf der Karte)
// aus dem hochgeladenen Firmenlogo. Ohne eigenes Logo bleibt der bewährte
// statische Matei-Fallback bzw. der reine Text-Header (logoText) erhalten -
// niemals ein hartes Fehlschlagen der Pass-Erstellung wegen eines fehlenden
// oder nicht ladbaren Kundenlogos.
async function buildLogoAssets(logoImage: string | null): Promise<Record<string, Buffer>> {
  const files: Record<string, Buffer> = {
    "icon.png": fs.readFileSync(path.join(ICON_DIR, "icon.png")),
    "icon@2x.png": fs.readFileSync(path.join(ICON_DIR, "icon@2x.png")),
    "icon@3x.png": fs.readFileSync(path.join(ICON_DIR, "icon@3x.png")),
  };
  if (!logoImage) return files;

  const [icon1, icon2, icon3, logo1, logo2, logo3] = await Promise.all([
    renderContainedImage(logoImage, 29, 29, 0.06),
    renderContainedImage(logoImage, 58, 58, 0.06),
    renderContainedImage(logoImage, 87, 87, 0.06),
    renderContainedImage(logoImage, 120, 36, 0.04),
    renderContainedImage(logoImage, 240, 72, 0.04),
    renderContainedImage(logoImage, 360, 108, 0.04),
  ]);
  if (icon1) files["icon.png"] = icon1;
  if (icon2) files["icon@2x.png"] = icon2;
  if (icon3) files["icon@3x.png"] = icon3;
  if (logo1) files["logo.png"] = logo1;
  if (logo2) files["logo@2x.png"] = logo2;
  if (logo3) files["logo@3x.png"] = logo3;
  return files;
}

// Baut die .pkpass-Datei (ZIP aus pass.json, manifest.json und PKCS#7-
// Signatur) direkt im Speicher - kein Zwischenspeichern auf Disk nötig.
export async function buildApplePass(input: ApplePassInput): Promise<Buffer | null> {
  if (!isAppleWalletConfigured()) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const isStamp = input.type === "stamp";
  const current = isStamp ? input.stamps : input.points;
  const target = isStamp ? input.stampsRequired : input.pointsPerReward;
  const remaining = Math.max(0, target - current);
  const design = resolveDesign(input.design);

  try {
    const [logoFiles, heroMaster] = await Promise.all([
      buildLogoAssets(design.logoImage),
      renderWalletHero({
        design,
        type: input.type,
        stamps: input.stamps,
        stampsRequired: input.stampsRequired,
        points: input.points,
        pointsPerReward: input.pointsPerReward,
      }),
    ]);
    const [strip3x, strip2x, strip1x] = await Promise.all([
      Promise.resolve(heroMaster),
      downscalePng(heroMaster, 750, 246),
      downscalePng(heroMaster, 375, 123),
    ]);

    const pass = new PKPass(
      {
        ...logoFiles,
        "strip.png": strip1x,
        "strip@2x.png": strip2x,
        "strip@3x.png": strip3x,
      },
      {
        wwdr: pem("APPLE_WWDR_CERTIFICATE"),
        signerCert: pem("APPLE_PASS_SIGNER_CERT"),
        signerKey: pem("APPLE_PASS_SIGNER_KEY"),
        signerKeyPassphrase: process.env.APPLE_PASS_SIGNER_KEY_PASSPHRASE || undefined,
      },
      {
        serialNumber: input.serial,
        description: input.programTitle,
        organizationName: input.orgName,
        passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER,
        teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
        webServiceURL: `${appUrl}/api/wallet/apple`,
        authenticationToken: appleAuthToken(input.serial),
        backgroundColor: hexToRgbString(input.backgroundColorHex),
        foregroundColor: hexToRgbString(input.foregroundColorHex),
        labelColor: hexToRgbString(input.foregroundColorHex),
        logoText: input.orgName,
      }
    );

    pass.type = "storeCard";
    pass.primaryFields.push({
      key: "balance",
      label: isStamp ? "Stempel" : "Punkte",
      value: `${current} / ${target}`,
    });
    pass.secondaryFields.push({ key: "reward", label: "Belohnung", value: input.rewardDescription || "-" });
    pass.auxiliaryFields.push({
      key: "remaining",
      label: "Bis zur Belohnung",
      value: remaining > 0 ? `noch ${remaining}` : "jetzt einlösen!",
    });
    pass.backFields.push(
      { key: "info", label: "Info", value: `Digitale Treuekarte von ${input.orgName}` },
      { key: "serial", label: "Karten-ID", value: input.serial.slice(0, 8).toUpperCase() }
    );
    // QR ist das primäre Format (von Apple selbst für Wallet-Karten
    // empfohlen und von jedem Kamera-Scanner lesbar, siehe Scanner.tsx).
    // Code128 als zweites, optionales Format daneben - falls ein Betrieb
    // einen klassischen Laser-/Linearscanner am Kassenbereich hat, der QR
    // nicht liest, funktioniert die Karte trotzdem. Apple zeigt nur das
    // erste Format an, hält beide aber im Pass vor.
    pass.setBarcodes(
      { format: "PKBarcodeFormatQR", message: `${appUrl}/c/${input.serial}`, messageEncoding: "iso-8859-1" },
      { format: "PKBarcodeFormatCode128", message: input.serial, messageEncoding: "iso-8859-1" }
    );

    return pass.getAsBuffer();
  } catch (e: any) {
    console.error("[apple-wallet] Pass-Erstellung fehlgeschlagen:", e.message);
    return null;
  }
}

// Weckt die Wallet-App auf einem registrierten Gerät auf, damit sie den
// aktualisierten Pass über den Webservice erneut abruft. Apple Wallet nutzt
// dafür dieselbe Pass-Type-ID-Zertifikat/Key-Kombination wie zum Signieren -
// keine separate "Push-Zertifikat" nötig. Reines Node http2 (mTLS), keine
// zusätzliche Abhängigkeit.
function sendApnsPush(pushToken: string): Promise<boolean> {
  return new Promise((resolve) => {
    let client: http2.ClientHttp2Session;
    try {
      client = http2.connect("https://api.push.apple.com:443", {
        cert: pem("APPLE_PASS_SIGNER_CERT"),
        key: pem("APPLE_PASS_SIGNER_KEY"),
        passphrase: process.env.APPLE_PASS_SIGNER_KEY_PASSPHRASE || undefined,
      });
    } catch (e: any) {
      console.error("[apple-wallet] APNs-Verbindung fehlgeschlagen:", e.message);
      resolve(false);
      return;
    }

    const timeout = setTimeout(() => {
      console.error("[apple-wallet] APNs-Push Zeitüberschreitung (>5s)");
      client.close();
      resolve(false);
    }, 5000);

    client.on("error", (e) => {
      clearTimeout(timeout);
      console.error("[apple-wallet] APNs-Client-Fehler:", e.message);
      resolve(false);
    });

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${pushToken}`,
      "apns-topic": process.env.APPLE_PASS_TYPE_IDENTIFIER ?? "",
      "apns-push-type": "background",
      "apns-priority": "5",
    });

    let status = 0;
    let responseBody = "";
    req.on("response", (headers) => {
      status = Number(headers[":status"]);
    });
    req.on("data", (chunk) => {
      responseBody += chunk;
    });
    req.on("end", () => {
      clearTimeout(timeout);
      client.close();
      if (status !== 200) {
        console.error(`[apple-wallet] APNs-Push abgelehnt (Status ${status}):`, responseBody.slice(0, 300));
      }
      resolve(status === 200);
    });
    req.on("error", (e) => {
      clearTimeout(timeout);
      console.error("[apple-wallet] APNs-Anfrage-Fehler:", e.message);
      resolve(false);
    });
    req.end(JSON.stringify({})); // leere Payload - weckt die App nur zum Neuladen des Passes
  });
}

// Schickt eine Push-Benachrichtigung an alle für diese Karte registrierten
// Geräte. Darf niemals werfen - wird nach jedem Stempel/jeder Einlösung
// aufgerufen und soll die eigentliche Aktion nie blockieren oder abbrechen.
export async function sendApplePushNotifications(serial: string): Promise<void> {
  if (!isAppleWalletConfigured()) return;
  try {
    const admin = createAdminClient();
    const { data: regs } = await admin
      .from("apple_wallet_registrations")
      .select("push_token")
      .eq("serial_number", serial);
    if (!regs || regs.length === 0) return;
    await Promise.allSettled(regs.map((r: any) => sendApnsPush(r.push_token)));
  } catch (e: any) {
    console.error("[apple-wallet] Push-Lookup-Fehler:", e.message);
  }
}
