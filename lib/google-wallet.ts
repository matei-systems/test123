import jwt from "jsonwebtoken";

// Google Wallet braucht ein Google-Cloud-Projekt mit aktivierter Wallet API,
// einen verifizierten Loyalty-Program-Issuer-Account (das prüft Google
// selbst, das kann ich nicht anlegen) und einen Service-Account-Schlüssel.
// Bis diese drei Variablen gesetzt sind, bleibt die Integration inaktiv -
// der Code ist fertig, wird aber automatisch scharf, sobald die
// Umgebungsvariablen hinterlegt sind. Kein Neu-Deploy nötig.
export function isGoogleWalletConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_WALLET_ISSUER_ID &&
      process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_WALLET_PRIVATE_KEY
  );
}

export interface GoogleWalletCardInput {
  serial: string;
  orgName: string;
  programTitle: string;
  rewardDescription: string;
  type: "stamp" | "points";
  stamps: number;
  stampsRequired: number;
  points: number;
  pointsPerReward: number;
  themeColorHex: string;
}

// Baut den "Save to Google Wallet"-Link. Die Klassen-/Objekt-Definition wird
// direkt im JWT mitgeschickt (Google legt sie beim Speichern selbst an) -
// dafür ist keine separate API-Anfrage vorab nötig, nur ein signierter Link.
// Format folgt Googles offizieller Wallet-API-Dokumentation.
export function buildGoogleWalletSaveUrl(input: GoogleWalletCardInput): string | null {
  if (!isGoogleWalletConfigured()) return null;

  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const classId = `${issuerId}.matei_loyalty_class`;
  const objectId = `${issuerId}.card_${input.serial}`;
  const isStamp = input.type === "stamp";
  const current = isStamp ? input.stamps : input.points;
  const target = isStamp ? input.stampsRequired : input.pointsPerReward;

  const loyaltyClass = {
    id: classId,
    issuerName: input.orgName,
    programName: input.programTitle,
    reviewStatus: "UNDER_REVIEW",
  };

  const loyaltyObject = {
    id: objectId,
    classId,
    state: "ACTIVE",
    accountName: input.orgName,
    loyaltyPoints: {
      label: isStamp ? "Stempel" : "Punkte",
      balance: { string: `${current} / ${target}` },
    },
    barcode: { type: "QR_CODE", value: `${appUrl}/c/${input.serial}` },
    hexBackgroundColor: input.themeColorHex,
    textModulesData: [{ header: "Belohnung", body: input.rewardDescription }],
  };

  const payload = {
    iss: serviceAccountEmail,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [appUrl],
    payload: {
      loyaltyClasses: [loyaltyClass],
      loyaltyObjects: [loyaltyObject],
    },
  };

  const token = jwt.sign(payload, privateKey, { algorithm: "RS256" });
  return `https://pay.google.com/gp/v/save/${token}`;
}
