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

function privateKey(): string {
  return (process.env.GOOGLE_WALLET_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
}

// Jedes Programm bekommt seine eigene Klasse (nicht eine gemeinsame für alle
// Betriebe!) - issuerName/programName unterscheiden sich pro Organisation,
// eine geteilte Klasse würde fremde Betriebe im selben Google-Wallet-Objekt
// vermischen. UUIDs dürfen laut Google-Format keine Bindestriche enthalten.
export function googleClassId(programId: string): string {
  return `${process.env.GOOGLE_WALLET_ISSUER_ID}.class_${programId.replace(/-/g, "")}`;
}
export function googleObjectId(serial: string): string {
  return `${process.env.GOOGLE_WALLET_ISSUER_ID}.card_${serial}`;
}

// OAuth2 JWT-Bearer-Flow (RFC 7523): signiert ein kurzlebiges JWT mit dem
// Service-Account-Schlüssel und tauscht es gegen ein Access Token für die
// Wallet-API. Entspricht genau dem, was google-auth-library intern tut -
// hier ohne zusätzliche Abhängigkeit, da jsonwebtoken schon vorhanden ist.
async function getGoogleAccessToken(): Promise<string | null> {
  if (!isGoogleWalletConfigured()) return null;
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
      scope: "https://www.googleapis.com/auth/wallet_object.issuer",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    privateKey(),
    { algorithm: "RS256" }
  );

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error("[google-wallet] OAuth2-Token-Tausch fehlgeschlagen:", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const data = await res.json();
    return data.access_token ?? null;
  } catch (e: any) {
    console.error("[google-wallet] OAuth2-Token-Tausch-Fehler:", e.message);
    return null;
  }
}

async function walletApiRequest(method: string, path: string, body?: unknown): Promise<{ ok: boolean; status: number }> {
  const token = await getGoogleAccessToken();
  if (!token) return { ok: false, status: 0 };
  try {
    const res = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      console.error(`[google-wallet] ${method} ${path} fehlgeschlagen:`, res.status, (await res.text().catch(() => "")).slice(0, 300));
    }
    return { ok: res.ok, status: res.status };
  } catch (e: any) {
    console.error(`[google-wallet] ${method} ${path} Fehler:`, e.message);
    return { ok: false, status: 0 };
  }
}

export interface GoogleClassInput {
  programId: string;
  orgName: string;
  programTitle: string;
  logoUrl?: string | null;
}

// Legt die Klasse an (einmal pro Programm) oder aktualisiert sie, falls sie
// schon existiert (z. B. weil der Betrieb den Anzeigenamen geändert hat).
// Wird still (ohne zu werfen) übersprungen, solange nicht konfiguriert -
// darf niemals das Speichern eines Programms blockieren oder verlangsamen.
// programLogo ist klassenweit (nicht pro Kunde) - Google zeigt es oben links
// auf jeder Karte dieses Programms, sobald ein eigenes Logo hochgeladen wurde.
export async function upsertGoogleLoyaltyClass(input: GoogleClassInput): Promise<void> {
  if (!isGoogleWalletConfigured()) return;
  const id = googleClassId(input.programId);
  const payload = {
    id,
    issuerName: input.orgName,
    programName: input.programTitle,
    reviewStatus: "UNDER_REVIEW",
    ...(input.logoUrl
      ? { programLogo: { sourceUri: { uri: input.logoUrl }, contentDescription: { defaultValue: { language: "de", value: "Logo" } } } }
      : {}),
  };
  const inserted = await walletApiRequest("POST", "loyaltyClass", payload);
  if (!inserted.ok && inserted.status === 409) {
    await walletApiRequest("PUT", `loyaltyClass/${id}`, payload);
  }
}

export interface GoogleObjectInput {
  programId: string;
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
  heroImageUrl?: string | null;
  logoUrl?: string | null;
}

// heroImage ist das große Bannerbild samt überlagerten Stempel-Icons (siehe
// lib/card-render.ts) - wird von lib/wallet-updates.ts bei jeder
// Kartenänderung neu gerendert, in Supabase Storage hochgeladen und hier per
// URL referenziert (Google lädt das Bild selbst nach, kein Datei-Upload über
// diese API möglich). Die URL trägt einen Versions-Query-Parameter (siehe
// wallet-updates.ts), damit Googles Bild-Cache nie eine veraltete Version
// ausliefert.
function loyaltyObjectPayload(input: GoogleObjectInput) {
  const isStamp = input.type === "stamp";
  const current = isStamp ? input.stamps : input.points;
  const target = isStamp ? input.stampsRequired : input.pointsPerReward;
  const remaining = Math.max(0, target - current);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return {
    id: googleObjectId(input.serial),
    classId: googleClassId(input.programId),
    state: "ACTIVE",
    accountName: input.orgName,
    loyaltyPoints: {
      label: isStamp ? "Stempel" : "Punkte",
      balance: { string: `${current} / ${target}` },
    },
    barcode: { type: "QR_CODE", value: `${appUrl}/c/${input.serial}` },
    hexBackgroundColor: input.themeColorHex,
    ...(input.heroImageUrl
      ? { heroImage: { sourceUri: { uri: input.heroImageUrl }, contentDescription: { defaultValue: { language: "de", value: "Treuekarte" } } } }
      : {}),
    textModulesData: [
      { header: "Belohnung", body: input.rewardDescription },
      {
        header: "Fortschritt",
        body: remaining > 0 ? `Noch ${remaining} bis zur Belohnung` : "Belohnung jetzt einlösbar!",
      },
    ],
  };
}

// Legt das Objekt proaktiv an, sobald eine Karte ausgegeben wird - nicht erst
// wenn der Kunde auf "Zu Google Wallet hinzufügen" klickt. So funktionieren
// spätere PATCH-Updates (Stempel/Einlösung) auch dann, wenn die Karte noch
// gar nicht im Wallet des Kunden gespeichert wurde.
export async function upsertGoogleLoyaltyObject(input: GoogleObjectInput): Promise<void> {
  if (!isGoogleWalletConfigured()) return;
  const payload = loyaltyObjectPayload(input);
  const inserted = await walletApiRequest("POST", "loyaltyObject", payload);
  if (!inserted.ok && inserted.status === 409) {
    await walletApiRequest("PUT", `loyaltyObject/${payload.id}`, payload);
  }
}

// Schneller Update nach einem Stempel/einer Einlösung - PATCH statt
// vollständigem PUT. Aktualisiert neben dem Punktestand auch das Hero-Bild
// (neuer Stempel-Füllstand ist dort eingebrannt, siehe lib/card-render.ts)
// und die "Noch X"-Restanzeige.
export async function patchGoogleLoyaltyPoints(input: GoogleObjectInput): Promise<void> {
  if (!isGoogleWalletConfigured()) return;
  const isStamp = input.type === "stamp";
  const current = isStamp ? input.stamps : input.points;
  const target = isStamp ? input.stampsRequired : input.pointsPerReward;
  const remaining = Math.max(0, target - current);
  await walletApiRequest("PATCH", `loyaltyObject/${googleObjectId(input.serial)}`, {
    loyaltyPoints: { label: isStamp ? "Stempel" : "Punkte", balance: { string: `${current} / ${target}` } },
    ...(input.heroImageUrl
      ? { heroImage: { sourceUri: { uri: input.heroImageUrl }, contentDescription: { defaultValue: { language: "de", value: "Treuekarte" } } } }
      : {}),
    textModulesData: [
      { header: "Belohnung", body: input.rewardDescription },
      {
        header: "Fortschritt",
        body: remaining > 0 ? `Noch ${remaining} bis zur Belohnung` : "Belohnung jetzt einlösbar!",
      },
    ],
  });
}

// Baut den "Save to Wallet"-Link. Klassen-/Objekt-Definition werden zusätzlich
// inline im JWT mitgeschickt (Google verlangt das für den Save-Button so),
// falls sie über obige Upserts aber schon existieren, verknüpft Google beim
// Speichern einfach das bestehende (und damit aktuelle) Objekt.
export function buildGoogleWalletSaveUrl(input: GoogleObjectInput): string | null {
  if (!isGoogleWalletConfigured()) return null;

  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const loyaltyClass = {
    id: googleClassId(input.programId),
    issuerName: input.orgName,
    programName: input.programTitle,
    reviewStatus: "UNDER_REVIEW",
    ...(input.logoUrl
      ? { programLogo: { sourceUri: { uri: input.logoUrl }, contentDescription: { defaultValue: { language: "de", value: "Logo" } } } }
      : {}),
  };
  const loyaltyObject = loyaltyObjectPayload(input);

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

  const token = jwt.sign(payload, privateKey(), { algorithm: "RS256" });
  return `https://pay.google.com/gp/v/save/${token}`;
}
