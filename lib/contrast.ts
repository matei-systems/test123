// Reine Funktionen ohne DOM-Abhängigkeit - laufen identisch in Server- und
// Client-Components, damit die Kundenkarte serverseitig (öffentliche
// Kartenseite) exakt so gerendert wird wie im Live-Vorschau-Editor.

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num) || full.length !== 6) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// WCAG relative luminance (0 = schwarz, 1 = weiß).
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Für Verlauf/Farbe-Hintergründe: welche Textfarbe ist lesbar?
export function readableTextColor(hex: string): string {
  return relativeLuminance(hex) > 0.5 ? "#141414" : "#FFFFFF";
}

export function readableTextColorForGradient(from: string, to: string): string {
  const avg = (relativeLuminance(from) + relativeLuminance(to)) / 2;
  return avg > 0.5 ? "#141414" : "#FFFFFF";
}

// Für Hintergrundbilder: die Bild-Helligkeit (0-1) wird beim Upload einmalig
// client-seitig per Canvas gemessen (siehe ImageUpload.tsx) und in
// design.bgLuminance gespeichert - so muss das Bild beim Rendern nie erneut
// analysiert werden (funktioniert dadurch auch serverseitig ohne DOM/Canvas).
// Ein Bild braucht IMMER einen Verlaufs-Schleier, damit Text unabhängig vom
// Motiv lesbar bleibt; je heller das Bild, desto kräftiger der Schleier.
export function overlayForImage(bgLuminance: number | undefined): { gradient: string; textColor: string } {
  const l = bgLuminance ?? 0.4;
  const bottomOpacity = 0.35 + l * 0.45; // 0.35 (dunkles Bild) .. 0.8 (helles Bild)
  const topOpacity = 0.1 + l * 0.25;
  return {
    gradient: `linear-gradient(180deg, rgba(0,0,0,${topOpacity.toFixed(2)}) 0%, rgba(0,0,0,${(bottomOpacity * 0.5).toFixed(2)}) 45%, rgba(0,0,0,${bottomOpacity.toFixed(2)}) 100%)`,
    textColor: "#FFFFFF",
  };
}
