import { THEMES } from "@/lib/themes";
import { readableTextColorForGradient, readableTextColor, overlayForImage } from "@/lib/contrast";
import { resolveStampIconKey, DEFAULT_STAMP_ICON_KEY } from "@/lib/stamp-icons";

export type BaseMode = "gradient" | "color";
export type CornerRadius = "lg" | "xl" | "2xl";

export interface CardDesign {
  // Basisfarbe: Header-/Footer-Bereich der Karte, und Fallback-Hintergrund,
  // falls kein Bannerbild hinterlegt ist.
  baseMode: BaseMode;
  gradientFrom: string;
  gradientTo: string;
  solidColor: string;

  // Banner: das große Hero-Foto in der Kartenmitte, auf dem die Stempel
  // liegen (siehe Referenzbilder des Kunden - Kaffeebohnen, Latte Art usw.).
  // Optional: ohne Bannerbild fällt die Karte auf die Basisfarbe zurück.
  bannerImage: string | null;
  bannerLuminance: number; // 0..1, client-seitig beim Upload gemessen
  bannerFocalY: number; // 0..100, Bildausschnitt vertikal

  // Logo
  logo: string; // 2-stelliger Fallback-Buchstabe ohne Bild
  logoImage: string | null;
  logoScale: number; // 0.6..1.6
  logoOffsetX: number; // -15..15 (%)
  logoOffsetY: number; // -15..15 (%)

  // Text & Form
  textColor: "auto" | string;
  cornerRadius: CornerRadius;

  // Stempel: entweder ein Preset aus lib/stamp-icons.ts, oder ein eigenes
  // hochgeladenes Icon (überschreibt das Preset, wenn gesetzt).
  stampIconKey: string;
  stampIconImage: string | null;

  // Legacy (P4): Index in THEMES, nur noch als Startwert für Verläufe genutzt.
  theme: number;
}

export const DEFAULT_DESIGN: CardDesign = {
  baseMode: "gradient",
  gradientFrom: THEMES[0].from,
  gradientTo: THEMES[0].to,
  solidColor: "#3B2A20",
  bannerImage: null,
  bannerLuminance: 0.4,
  bannerFocalY: 50,
  logo: "C",
  logoImage: null,
  logoScale: 1,
  logoOffsetX: 0,
  logoOffsetY: 0,
  textColor: "auto",
  cornerRadius: "2xl",
  stampIconKey: DEFAULT_STAMP_ICON_KEY,
  stampIconImage: null,
  theme: 0,
};

export const CORNER_RADIUS_CLASS: Record<CornerRadius, string> = {
  lg: "rounded-lg",
  xl: "rounded-2xl",
  "2xl": "rounded-[28px]",
};

// Programme, die vor P11 angelegt wurden, speichern das alte Format
// {backgroundMode: "gradient"|"color"|"image", backgroundImage, bgLuminance,
// backgroundPositionY, stampIcon: "✓"|"★"|...}. resolveDesign() übersetzt
// das automatisch ins neue Modell: ein früherer Vollbild-Hintergrund wird
// zum neuen Bannerfoto (sieht mit dem neuen Layout sogar hochwertiger aus
// als vorher, keine Regression), Emoji-Stempel werden auf den nächstliegenden
// Icon-Key gemappt (siehe lib/stamp-icons.ts).
export function resolveDesign(raw: any): CardDesign {
  const theme = typeof raw?.theme === "number" ? raw.theme : 0;
  const t = THEMES[theme] ?? THEMES[0];
  const legacyWasFullImage = raw?.backgroundMode === "image" && Boolean(raw?.backgroundImage);

  return {
    baseMode: raw?.baseMode ?? (raw?.backgroundMode === "color" ? "color" : "gradient"),
    gradientFrom: raw?.gradientFrom ?? t.from,
    gradientTo: raw?.gradientTo ?? t.to,
    solidColor: raw?.solidColor ?? t.from,
    bannerImage: raw?.bannerImage ?? (legacyWasFullImage ? raw.backgroundImage : null),
    bannerLuminance:
      typeof raw?.bannerLuminance === "number"
        ? raw.bannerLuminance
        : typeof raw?.bgLuminance === "number"
        ? raw.bgLuminance
        : 0.4,
    bannerFocalY:
      typeof raw?.bannerFocalY === "number"
        ? raw.bannerFocalY
        : typeof raw?.backgroundPositionY === "number"
        ? raw.backgroundPositionY
        : 50,
    logo: raw?.logo ?? "C",
    logoImage: raw?.logoImage ?? null,
    logoScale: typeof raw?.logoScale === "number" ? raw.logoScale : 1,
    logoOffsetX: typeof raw?.logoOffsetX === "number" ? raw.logoOffsetX : 0,
    logoOffsetY: typeof raw?.logoOffsetY === "number" ? raw.logoOffsetY : 0,
    textColor: raw?.textColor ?? "auto",
    cornerRadius: raw?.cornerRadius ?? "2xl",
    stampIconKey: resolveStampIconKey(raw?.stampIconKey ?? raw?.stampIcon),
    stampIconImage: raw?.stampIconImage ?? null,
    theme,
  };
}

export function cardBaseStyle(d: CardDesign): React.CSSProperties {
  if (d.baseMode === "color") return { background: d.solidColor };
  return { background: `linear-gradient(140deg, ${d.gradientFrom}, ${d.gradientTo})` };
}

export function cardTextColor(d: CardDesign): string {
  if (d.textColor !== "auto") return d.textColor;
  if (d.baseMode === "color") return readableTextColor(d.solidColor);
  return readableTextColorForGradient(d.gradientFrom, d.gradientTo);
}

// Das Banner bekommt unabhängig von der Kartentextfarbe immer einen dunklen
// Verlaufs-Schleier von oben nach unten (wie bei allen Referenzbildern) -
// Weiß darüber ist dadurch immer zuverlässig lesbar, ganz gleich wie hell
// das Foto selbst ist.
export function bannerOverlayGradient(d: CardDesign): string {
  return overlayForImage(d.bannerLuminance).gradient;
}

// Google/Apple Wallet erlauben nur eine einzelne Volltonfarbe fürs
// Kartendesign (Hintergrund hinter den Textfeldern), kein Verlauf - diese
// Funktion wählt eine sinnvolle Repräsentativfarbe für beide Wallet-
// Integrationen.
export function themeColorHex(d: CardDesign): string {
  if (d.baseMode === "color") return d.solidColor;
  return d.gradientFrom;
}
