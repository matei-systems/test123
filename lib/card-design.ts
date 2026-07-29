import { THEMES } from "@/lib/themes";
import { readableTextColorForGradient, readableTextColor, overlayForImage } from "@/lib/contrast";

export type BackgroundMode = "gradient" | "color" | "image";
export type CornerRadius = "lg" | "xl" | "2xl";

export interface CardDesign {
  // Hintergrund
  backgroundMode: BackgroundMode;
  gradientFrom: string;
  gradientTo: string;
  solidColor: string;
  backgroundImage: string | null;
  bgLuminance: number; // 0..1, nur relevant bei backgroundMode === "image"
  backgroundPositionY: number; // 0..100, nur relevant bei backgroundMode === "image"

  // Logo
  logo: string; // 2-stelliger Fallback-Buchstabe ohne Bild
  logoImage: string | null;
  logoScale: number; // 0.6..1.6
  logoOffsetX: number; // -15..15 (%)
  logoOffsetY: number; // -15..15 (%)

  // Text & Form
  textColor: "auto" | string;
  cornerRadius: CornerRadius;
  stampIcon: string;

  // Legacy (P4): Index in THEMES, nur noch als Startwert für Verläufe genutzt.
  theme: number;
}

export const DEFAULT_DESIGN: CardDesign = {
  backgroundMode: "gradient",
  gradientFrom: THEMES[0].from,
  gradientTo: THEMES[0].to,
  solidColor: "#3B2A20",
  backgroundImage: null,
  bgLuminance: 0.4,
  backgroundPositionY: 50,
  logo: "C",
  logoImage: null,
  logoScale: 1,
  logoOffsetX: 0,
  logoOffsetY: 0,
  textColor: "auto",
  cornerRadius: "2xl",
  stampIcon: "✓",
  theme: 0,
};

export const STAMP_ICONS = ["✓", "★", "☕", "❤", "⚡", "🎁"];
export const CORNER_RADIUS_CLASS: Record<CornerRadius, string> = {
  lg: "rounded-lg",
  xl: "rounded-2xl",
  "2xl": "rounded-[28px]",
};

// Programme, die vor P8 angelegt wurden, haben nur {theme, logo, logoImage} in
// design. resolveDesign() füllt alle neuen Felder mit sinnvollen Defaults auf
// Basis des alten theme-Index, damit alte Karten unverändert weiter aussehen.
export function resolveDesign(raw: any): CardDesign {
  const theme = typeof raw?.theme === "number" ? raw.theme : 0;
  const t = THEMES[theme] ?? THEMES[0];
  return {
    backgroundMode: raw?.backgroundMode ?? "gradient",
    gradientFrom: raw?.gradientFrom ?? t.from,
    gradientTo: raw?.gradientTo ?? t.to,
    solidColor: raw?.solidColor ?? t.from,
    backgroundImage: raw?.backgroundImage ?? null,
    bgLuminance: typeof raw?.bgLuminance === "number" ? raw.bgLuminance : 0.4,
    backgroundPositionY: typeof raw?.backgroundPositionY === "number" ? raw.backgroundPositionY : 50,
    logo: raw?.logo ?? "C",
    logoImage: raw?.logoImage ?? null,
    logoScale: typeof raw?.logoScale === "number" ? raw.logoScale : 1,
    logoOffsetX: typeof raw?.logoOffsetX === "number" ? raw.logoOffsetX : 0,
    logoOffsetY: typeof raw?.logoOffsetY === "number" ? raw.logoOffsetY : 0,
    textColor: raw?.textColor ?? "auto",
    cornerRadius: raw?.cornerRadius ?? "2xl",
    stampIcon: raw?.stampIcon ?? "✓",
    theme,
  };
}

export function cardBackground(d: CardDesign): { style: React.CSSProperties; overlay: string | null } {
  if (d.backgroundMode === "image" && d.backgroundImage) {
    return {
      style: {
        backgroundImage: `url(${d.backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: `center ${d.backgroundPositionY}%`,
      },
      overlay: overlayForImage(d.bgLuminance).gradient,
    };
  }
  if (d.backgroundMode === "color") {
    return { style: { background: d.solidColor }, overlay: null };
  }
  return { style: { background: `linear-gradient(140deg, ${d.gradientFrom}, ${d.gradientTo})` }, overlay: null };
}

export function cardTextColor(d: CardDesign): string {
  if (d.textColor !== "auto") return d.textColor;
  if (d.backgroundMode === "image" && d.backgroundImage) return overlayForImage(d.bgLuminance).textColor;
  if (d.backgroundMode === "color") return readableTextColor(d.solidColor);
  return readableTextColorForGradient(d.gradientFrom, d.gradientTo);
}
