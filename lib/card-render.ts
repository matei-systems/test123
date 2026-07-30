import { createCanvas, loadImage, Path2D, type SKRSContext2D, type Image } from "@napi-rs/canvas";
import type { CardDesign } from "@/lib/card-design";
import { stampIconPath } from "@/lib/stamp-icons";

// Rendert das Hero-/Bannerbild samt überlagerten Stempel-Icons serverseitig
// zu einem fertigen PNG - das ist der einzige Weg, mit dem Apple Wallet und
// Google Wallet (die beide kein natives "Stempelraster"-UI-Element haben)
// optisch wie die Referenzbilder aussehen: eine Reihe individueller,
// gefüllt/leer unterscheidbarer Icons direkt auf einem Marken-Foto. Wird bei
// jeder Kartenänderung (Stempel, Design) neu aufgerufen (siehe
// lib/wallet-updates.ts) und liefert exakt dasselbe Bild für Apples
// stripImage wie für Googles heroImage - eine Render-Funktion für beide
// Plattformen, kein Pflege-Aufwand für zwei getrennte Layouts.
//
// Auflösung: 1125x369px entspricht exakt Apples empfohlener @3x-Strip-Größe
// (375x123pt) und liegt mit einem Seitenverhältnis von ~3,05 nur ~1% neben
// Googles empfohlener Hero-Bild-Größe (1032x336, ~3,07) - beide Plattformen
// skalieren/zentrieren das Bild ohnehin serverseitig, die Abweichung ist
// nicht wahrnehmbar.
export const HERO_WIDTH = 1125;
export const HERO_HEIGHT = 369;

const TIMEOUT_MS = 6000;

async function fetchImageSafe(url: string | null | undefined): Promise<Image | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return await loadImage(buf);
  } catch (e: any) {
    console.error("[card-render] Bild konnte nicht geladen werden:", url, e.message);
    return null;
  }
}

// Löst einen CSS-artigen Verlaufswinkel (wie in card-design.ts:
// "linear-gradient(140deg, from, to)") in Canvas-Gradient-Koordinaten auf,
// damit Web-Vorschau und gerendertes Wallet-Bild optisch übereinstimmen.
function angledGradient(ctx: SKRSContext2D, angleDeg: number, w: number, h: number, from: string, to: string) {
  const rad = (angleDeg * Math.PI) / 180;
  const halfW = w / 2;
  const halfH = h / 2;
  const length = Math.abs(halfW * Math.sin(rad)) + Math.abs(halfH * Math.cos(rad));
  const cx = halfW;
  const cy = halfH;
  const x1 = cx - Math.sin(rad) * length;
  const y1 = cy + Math.cos(rad) * length;
  const x2 = cx + Math.sin(rad) * length;
  const y2 = cy - Math.cos(rad) * length;
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  return grad;
}

function drawCardBase(ctx: SKRSContext2D, design: CardDesign, w: number, h: number) {
  if (design.baseMode === "color") {
    ctx.fillStyle = design.solidColor;
  } else {
    ctx.fillStyle = angledGradient(ctx, 140, w, h, design.gradientFrom, design.gradientTo);
  }
  ctx.fillRect(0, 0, w, h);
}

// Dieselbe Formel wie overlayForImage() in lib/contrast.ts (dort als CSS-
// Verlauf für den Browser, hier als Canvas-Gradient) - je heller das Foto,
// desto kräftiger der Verlauf, damit weiße Icons/Schrift immer lesbar bleiben.
function drawBannerOverlay(ctx: SKRSContext2D, luminance: number, w: number, h: number) {
  const l = luminance ?? 0.4;
  const bottomOpacity = 0.35 + l * 0.45;
  const topOpacity = 0.1 + l * 0.25;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, `rgba(0,0,0,${topOpacity.toFixed(2)})`);
  grad.addColorStop(0.45, `rgba(0,0,0,${(bottomOpacity * 0.5).toFixed(2)})`);
  grad.addColorStop(1, `rgba(0,0,0,${bottomOpacity.toFixed(2)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawCoverImage(ctx: SKRSContext2D, img: Image, x: number, y: number, w: number, h: number, focalY: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) * (focalY / 100);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

interface StampCell {
  cx: number;
  cy: number;
  r: number;
  filled: boolean;
}

function stampLayout(count: number, areaX: number, areaY: number, areaW: number, areaH: number): StampCell[] {
  const rows = count > 6 ? 2 : 1;
  const cols = Math.ceil(count / rows);
  const cellW = areaW / cols;
  const cellH = areaH / rows;
  const r = Math.min(cellW, cellH) * 0.36;
  const cells: StampCell[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const rowCount = row === rows - 1 ? count - cols * (rows - 1) : cols;
    const rowW = rowCount * cellW;
    const rowOffsetX = areaX + (areaW - rowW) / 2;
    const cx = rowOffsetX + col * cellW + cellW / 2;
    const cy = areaY + row * cellH + cellH / 2;
    cells.push({ cx, cy, r, filled: false });
  }
  return cells;
}

async function drawStampIcon(
  ctx: SKRSContext2D,
  cell: StampCell,
  iconImage: Image | null,
  iconPath: string,
  filled: boolean,
  accentColor: string
) {
  const { cx, cy, r } = cell;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  if (filled) {
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = filled ? 1 : 0.55;
  if (iconImage) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
    ctx.clip();
    const d = r * 1.56;
    ctx.drawImage(iconImage, cx - d / 2, cy - d / 2, d, d);
  } else {
    const iconSize = r * 1.15;
    ctx.translate(cx - iconSize / 2, cy - iconSize / 2);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = filled ? accentColor : "#FFFFFF";
    ctx.fill(new Path2D(iconPath));
  }
  ctx.restore();
}

export interface HeroRenderInput {
  design: CardDesign;
  type: "stamp" | "points";
  stamps: number;
  stampsRequired: number;
  points: number;
  pointsPerReward: number;
}

export async function renderWalletHero(input: HeroRenderInput): Promise<Buffer> {
  const { design } = input;
  const w = HERO_WIDTH;
  const h = HERO_HEIGHT;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  const bannerImg = await fetchImageSafe(design.bannerImage);
  if (bannerImg) {
    drawCoverImage(ctx, bannerImg, 0, 0, w, h, design.bannerFocalY);
    drawBannerOverlay(ctx, design.bannerLuminance, w, h);
  } else {
    drawCardBase(ctx, design, w, h);
  }

  if (input.type === "stamp" && input.stampsRequired > 0) {
    const customIcon = await fetchImageSafe(design.stampIconImage);
    const iconPath = stampIconPath(design.stampIconKey);
    const padX = w * 0.05;
    const padY = h * 0.08;
    const cells = stampLayout(input.stampsRequired, padX, padY, w - padX * 2, h - padY * 2);
    const accent = design.baseMode === "color" ? design.solidColor : design.gradientFrom;
    for (let i = 0; i < cells.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await drawStampIcon(ctx, cells[i], customIcon, iconPath, i < input.stamps, accent);
    }
  } else if (input.type === "points" && input.pointsPerReward > 0) {
    const barW = w * 0.86;
    const barH = 14;
    const barX = (w - barW) / 2;
    const barY = h - h * 0.16;
    const progress = Math.max(0, Math.min(1, input.points / input.pointsPerReward));
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, barX, barY, barW, barH, barH / 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, barX, barY, Math.max(barH, barW * progress), barH, barH / 2);
    ctx.fill();
    ctx.restore();
  }

  return canvas.toBuffer("image/png");
}

function roundRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Skaliert einen bereits gerenderten PNG-Buffer auf eine kleinere Zielgröße
// herunter - für Apples @2x/@1x-Varianten (Apple verlangt alle drei
// Auflösungen im selben .pkpass, wählt je nach Gerät automatisch die
// passende aus).
export async function downscalePng(buffer: Buffer, w: number, h: number): Promise<Buffer> {
  const img = await loadImage(buffer);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toBuffer("image/png");
}

// Bettet ein hochgeladenes Bild (Logo/Icon) "contain" (mit transparentem
// Rand statt Beschnitt) in eine Zielgröße ein - für Apples logo.png/icon.png,
// die exakte Pixelmaße erwarten, aber beliebige Kunden-Logo-Seitenverhältnisse
// nicht verzerren sollen.
export async function renderContainedImage(url: string, w: number, h: number, pad = 0.14): Promise<Buffer | null> {
  const img = await fetchImageSafe(url);
  if (!img) return null;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const usableW = w * (1 - pad * 2);
  const usableH = h * (1 - pad * 2);
  const scale = Math.min(usableW / img.width, usableH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return canvas.toBuffer("image/png");
}
