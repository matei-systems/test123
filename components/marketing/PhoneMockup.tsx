"use client";

import { layoutStampGrid } from "@/lib/stamp-layout";
import { stampIconPath } from "@/lib/stamp-icons";
import { THEMES } from "@/lib/themes";
import { useTheme } from "@/components/marketing/ThemeProvider";
import type { Translations } from "@/lib/marketing/i18n";

// Hero-Mockup: die fertige Treuekarte, wie sie NACH dem Scannen im Handy des
// Kunden liegt - also als Wallet-Pass, nicht als Web-Karte. Der Aufbau folgt
// bewusst 1:1 dem Pass, den lib/apple-wallet.ts tatsächlich erzeugt
// (storeCard: Logo + logoText, Strip-Bild mit Stempelraster, primaryField
// "Stempel", secondaryField "Belohnung", auxiliaryField "Bis zur Belohnung",
// QR-Barcode) - der Interessent sieht auf der Startseite also genau das, was
// sein Kunde später bekommt, und nicht eine geschönte Fantasie-Grafik.
//
// Referenzmaße in Apple-Punkten: ein Pass ist auf dem iPhone 375pt breit, das
// Strip-Bild darüber exakt 375x123pt (dieselbe Fläche, die lib/card-render.ts
// serverseitig als 1125x369px @3x rendert). Alle Abstände werden als Prozent
// DIESER Referenzbreite ausgegeben, damit der Mockup in jeder Bildschirmbreite
// exakt die Proportionen eines echten Passes behält. Prozentuale Innen- und
// Außenabstände beziehen sich in CSS immer auf die BREITE des Elternelements -
// auch margin-top und padding-top -, deshalb trägt dieselbe Einheit auch die
// vertikalen Abstände.
const PASS_W = 375;
const STRIP_H = 123;
const STRIP_PAD_X = 20;
const STRIP_PAD_Y = 13;
const STAMP_GAP = 8;
const STAMP_MAX_CELL = 46;

const HERO_STAMPS = 7;
const HERO_STAMPS_REQUIRED = 10;

// Espresso - dieselbe Voreinstellung, die eine neue Karte im
// Programm-Assistenten bekommt (lib/themes.ts, DEFAULT_DESIGN).
const ESPRESSO = THEMES[0];

const u = (pt: number) => `${(pt / PASS_W) * 100}%`;

const LABEL_COLOR = "rgba(255,255,255,0.72)";

// Das Strip-Bild eines echten Betriebs ist ein Foto (Theke, Latte Art, ...).
// Für den Mockup wird die Anmutung eines warm ausgeleuchteten Café-Fotos aus
// gestapelten CSS-Verläufen gebaut statt aus einer Bilddatei: kein zusätzliches
// Asset im Bundle, kein externer Bild-Request, und die Landingpage behauptet
// nicht, ein Foto eines real existierenden Lokals zu zeigen.
const STRIP_PHOTO = [
  "radial-gradient(34% 76% at 8% 30%, rgba(255,232,198,0.26), transparent 72%)",
  "radial-gradient(22% 48% at 28% 8%, rgba(255,222,176,0.20), transparent 74%)",
  "radial-gradient(40% 70% at 78% 30%, rgba(255,178,102,0.32), transparent 72%)",
  "radial-gradient(52% 90% at 90% 92%, rgba(196,116,54,0.34), transparent 74%)",
  "radial-gradient(70% 100% at 40% 128%, rgba(42,24,14,0.62), transparent 70%)",
  `linear-gradient(142deg, #23150E, ${ESPRESSO.from} 34%, ${ESPRESSO.to} 88%)`,
].join(", ");

// Gleiche Form wie overlayForImage()/drawBannerOverlay(): oben und unten
// abdunkeln, damit die weißen Stempel auf jedem Untergrund stehen.
const STRIP_SHADE = "linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.34))";

function CoffeeIcon({ color, size }: { color: string; size: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size }} aria-hidden>
      <path d={stampIconPath("coffee")} fill={color} />
    </svg>
  );
}

function StampGrid() {
  const { rows, cols, cellSize } = layoutStampGrid(
    HERO_STAMPS_REQUIRED,
    PASS_W - 2 * STRIP_PAD_X,
    STRIP_H - 2 * STRIP_PAD_Y,
    STAMP_GAP,
    STAMP_MAX_CELL
  );

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      {Array.from({ length: rows }).map((_, row) => {
        const rowStart = row * cols;
        const rowCount = Math.min(cols, HERO_STAMPS_REQUIRED - rowStart);
        return (
          <div
            key={row}
            className="flex justify-center w-full"
            style={{ columnGap: u(STAMP_GAP), marginTop: row === 0 ? 0 : u(STAMP_GAP) }}
          >
            {Array.from({ length: rowCount }).map((_, c) => {
              const filled = rowStart + c < HERO_STAMPS;
              return (
                <div
                  key={c}
                  className="rounded-full grid place-items-center shrink-0"
                  style={{
                    width: u(cellSize),
                    aspectRatio: "1",
                    ...(filled
                      ? {
                          background: "rgba(255,255,255,0.97)",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.30)",
                        }
                      : {
                          background: "rgba(255,255,255,0.14)",
                          border: "1.5px solid rgba(255,255,255,0.45)",
                        }),
                  }}
                >
                  <div style={{ opacity: filled ? 1 : 0.55 }}>
                    <CoffeeIcon color={filled ? ESPRESSO.from : "#FFFFFF"} size="54%" />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function LoyaltyPass({ qr, m }: { qr: string; m: Translations["heroMock"] }) {
  return (
    <div
      className="pass relative z-10 w-full overflow-hidden rounded-[18px]"
      style={{
        // Einfarbig, nicht als Verlauf: Apple Wallet kennt für den
        // Passhintergrund nur EINE Volltonfarbe - genau die, die
        // themeColorHex() aus dem Kartendesign ableitet. Der Verlauf lebt
        // ausschließlich im Strip-Bild darüber, das wir selbst rendern.
        background: ESPRESSO.from,
        color: "#FFFFFF",
        boxShadow: "0 20px 40px -14px rgba(0,0,0,0.9), 0 0 0 0.5px rgba(255,255,255,0.10) inset",
      }}
    >
      {/* Kopfzeile = logo + logoText des Passes */}
      <div className="flex items-center" style={{ padding: `${u(15)} ${u(17)} ${u(13)}`, columnGap: u(9) }}>
        <div
          className="grid place-items-center rounded-full shrink-0"
          style={{ width: u(30), aspectRatio: "1", background: "rgba(255,255,255,0.95)" }}
        >
          <CoffeeIcon color={ESPRESSO.from} size="60%" />
        </div>
        <span className="pass-logotext font-semibold truncate">{m.passName}</span>
      </div>

      {/* Strip-Bild mit Stempelraster */}
      <div data-pass-strip className="relative w-full" style={{ aspectRatio: `${PASS_W} / ${STRIP_H}` }}>
        <div className="absolute inset-0" style={{ background: STRIP_PHOTO }} />
        <div className="absolute inset-0" style={{ background: STRIP_SHADE }} />
        <div className="absolute" style={{ inset: `${u(STRIP_PAD_Y)} ${u(STRIP_PAD_X)}` }}>
          <StampGrid />
        </div>
      </div>

      {/* primaryField / secondaryField / auxiliaryField */}
      <div style={{ padding: `${u(15)} ${u(17)} ${u(11)}` }}>
        <div className="pass-label uppercase" style={{ color: LABEL_COLOR }}>
          {m.labelBalance}
        </div>
        <div className="pass-primary font-bold" style={{ marginTop: u(2) }}>
          {HERO_STAMPS} / {HERO_STAMPS_REQUIRED}
        </div>

        <div className="flex items-start justify-between" style={{ marginTop: u(16), columnGap: u(14) }}>
          <div className="min-w-0">
            <div className="pass-label uppercase" style={{ color: LABEL_COLOR }}>
              {m.labelReward}
            </div>
            <div className="pass-value truncate" style={{ marginTop: u(2) }}>
              {m.reward}
            </div>
          </div>
          <div className="min-w-0 text-right">
            <div className="pass-label uppercase" style={{ color: LABEL_COLOR }}>
              {m.labelRemaining}
            </div>
            <div className="pass-value truncate" style={{ marginTop: u(2) }}>
              {m.remaining}
            </div>
          </div>
        </div>
      </div>

      {/* Barcode - im echten Pass ein QR auf weißem Grund */}
      <div className="flex justify-center" style={{ paddingBottom: u(16) }}>
        <div className="bg-white rounded-[9px]" style={{ width: u(124), padding: u(7) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="" className="block w-full" style={{ aspectRatio: "1" }} />
        </div>
      </div>
    </div>
  );
}

// Zweite Karte im Stapel - eine erfundene Musterbankkarte ("Musterbank",
// "Max Mustermann"), bewusst ohne Logo einer echten Bank oder eines echten
// Kartennetzwerks. Sie erklärt in einem Bild, worum es geht: die Treuekarte
// liegt im selben Wallet wie die Karten, die der Kunde ohnehin täglich nutzt.
function SampleBankCard({ m }: { m: Translations["heroMock"] }) {
  return (
    <div
      className="bankcard relative w-full overflow-hidden rounded-[16px] shrink-0"
      style={{
        aspectRatio: "1.586",
        background: "linear-gradient(145deg,#303A4C,#151A24 54%,#222B3D)",
        color: "#FFFFFF",
        boxShadow: "0 14px 30px -12px rgba(0,0,0,0.85), 0 0 0 0.5px rgba(255,255,255,0.10) inset",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(112deg, rgba(255,255,255,0.13), transparent 36%, transparent 64%, rgba(255,255,255,0.06))",
        }}
      />
      <div className="relative h-full flex flex-col justify-between" style={{ padding: "7%" }}>
        <div className="flex items-start justify-between">
          <span className="bankcard-name font-semibold">{m.bankName}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            className="opacity-65 shrink-0"
            style={{ width: "9%", aspectRatio: "1" }}
            aria-hidden
          >
            <path d="M4 9.5a5 5 0 0 1 0 5" />
            <path d="M8.5 6.5a10 10 0 0 1 0 11" />
            <path d="M13 3.5a15 15 0 0 1 0 17" />
          </svg>
        </div>

        {/* Chip auf halber Höhe - wie auf einer echten Karte */}
        <div
          className="rounded-[3px] relative overflow-hidden"
          style={{
            width: "13%",
            aspectRatio: "1.35",
            background: "linear-gradient(135deg,#F2DFB2,#B8912F 56%,#E8CB8E)",
            boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.30)",
          }}
        >
          <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: "rgba(0,0,0,0.22)" }} />
          <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: "rgba(0,0,0,0.22)" }} />
        </div>

        <div className="flex items-end justify-between" style={{ columnGap: "6%" }}>
          <div className="bankcard-num min-w-0 truncate">{m.bankNumber}</div>
          <div className="text-right shrink-0">
            <div className="bankcard-meta uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
              {m.bankType}
            </div>
            <div className="bankcard-meta uppercase" style={{ marginTop: "4%", color: "rgba(255,255,255,0.85)" }}>
              {m.bankHolder}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusIcons() {
  return (
    <span className="flex items-center gap-[4px] text-white shrink-0">
      {/* Mobilfunk */}
      <svg viewBox="0 0 18 12" fill="currentColor" className="phone-sicon" style={{ aspectRatio: "18 / 12" }} aria-hidden>
        <rect x="0" y="8.5" width="3" height="3.5" rx="1" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
        <rect x="10" y="2.8" width="3" height="9.2" rx="1" />
        <rect x="15" y="0" width="3" height="12" rx="1" />
      </svg>
      {/* WLAN */}
      <svg viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="phone-sicon" style={{ aspectRatio: "16 / 12" }} aria-hidden>
        <path d="M1.4 4.3a10 10 0 0 1 13.2 0" />
        <path d="M4 7a6.2 6.2 0 0 1 8 0" />
        <path d="M6.5 9.6a2.5 2.5 0 0 1 3 0" />
      </svg>
      {/* Akku */}
      <svg viewBox="0 0 26 12" fill="none" className="phone-sicon" style={{ aspectRatio: "26 / 12" }} aria-hidden>
        <rect x="0.6" y="0.6" width="22" height="10.8" rx="3.2" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
        <rect x="2.4" y="2.4" width="15" height="7.2" rx="1.9" fill="currentColor" />
        <path d="M24.2 4.2v3.6a2.1 2.1 0 0 0 0-3.6Z" fill="currentColor" fillOpacity="0.45" />
      </svg>
    </span>
  );
}

export default function PhoneMockup({ heroQr }: { heroQr: string }) {
  const { t } = useTheme();
  const m = t.heroMock;

  // Der Bildschirminhalt bleibt bewusst immer dunkel: er zeigt ein Handy, kein
  // Stück Landingpage - ein "helles" Handy gäbe es im Hell-Modus sonst nirgends.
  return (
    <div className="phone-float relative mx-auto w-full max-w-[320px]">
      {/* Seitentasten */}
      <span className="absolute left-[-3px] top-[16.5%] w-[3px] h-[3.4%] rounded-l-[2px] phone-key" />
      <span className="absolute left-[-3px] top-[24%] w-[3px] h-[7%] rounded-l-[2px] phone-key" />
      <span className="absolute left-[-3px] top-[33%] w-[3px] h-[7%] rounded-l-[2px] phone-key" />
      <span className="absolute right-[-3px] top-[27%] w-[3px] h-[10.5%] rounded-r-[2px] phone-key" />

      {/* Titan-Rahmen */}
      <div
        className="relative rounded-[46px] p-[10px]"
        style={{
          background: "linear-gradient(150deg,#4a444f,#171419 38%,#0f0d12 62%,#3a343f)",
          boxShadow: "0 44px 90px -24px rgba(0,0,0,0.85), 0 0 0 0.5px rgba(255,255,255,0.12) inset",
        }}
      >
        <div className="rounded-[37px] p-[2px]" style={{ background: "linear-gradient(160deg,#2a262f,#0a090c)" }}>
          <div className="phone-screen relative rounded-[35px] overflow-hidden flex flex-col" style={{ aspectRatio: "9 / 19.5", background: "#08070B" }}>
            {/* Dynamic Island */}
            <div className="absolute top-[1.9%] left-1/2 -translate-x-1/2 w-[31%] h-[4.1%] rounded-full bg-black z-30 flex items-center justify-end pr-[7%]">
              <span className="w-[13%] aspect-square rounded-full" style={{ background: "#131a20" }} />
            </div>

            {/* Statusleiste */}
            <div className="relative z-20 flex items-center justify-between px-[7.5%] pt-[4.4%] pb-[1%]">
              <span className="phone-time font-semibold text-white">{m.statusTime}</span>
              <StatusIcons />
            </div>

            {/* Wallet-Kopfzeile */}
            <div className="flex items-center justify-between px-[6.5%] pt-[3.4%] pb-[3.6%]">
              <span className="phone-title font-bold text-white tracking-[-0.02em]">{m.walletTitle}</span>
              <span
                className="grid place-items-center rounded-full text-white/85 shrink-0"
                style={{ width: "9%", aspectRatio: "1", background: "rgba(255,255,255,0.12)" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" className="w-[58%] h-[58%]" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </div>

            {/* Kartenstapel */}
            <div className="flex-1 min-h-0 px-[4%]">
              <LoyaltyPass qr={heroQr} m={m} />
              <div style={{ marginTop: "-2.5%" }}>
                <SampleBankCard m={m} />
              </div>
            </div>

            {/* Home-Indikator */}
            <div className="absolute bottom-[0.9%] left-1/2 -translate-x-1/2 w-[34%] h-[0.55%] rounded-full bg-white/70 z-30" />

            {/* Glasreflex über dem Display */}
            <div
              className="absolute inset-0 pointer-events-none z-40"
              style={{
                background:
                  "linear-gradient(118deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 22%, transparent 46%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
