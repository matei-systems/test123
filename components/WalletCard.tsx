import {
  resolveDesign,
  cardBaseStyle,
  cardTextColor,
  bannerOverlayGradient,
  themeColorHex,
  CORNER_RADIUS_CLASS,
  type CardDesign,
} from "@/lib/card-design";
import { stampIconPath } from "@/lib/stamp-icons";

interface Props {
  title: string;
  design: CardDesign | Record<string, any>;
  type: "stamp" | "points";
  stamps: number;
  stampsRequired: number;
  points: number;
  pointsPerReward: number;
  reward: string;
  serial: string;
  qrDataUrl?: string;
  /** Anzahl frisch hinzugekommener Stempel seit dem letzten Besuch - lässt die neuesten Zellen einfliegen. */
  justEarned?: number;
}

// Stempelraster: dieselbe Zeilen-/Spalten-Aufteilung (>6 Stempel -> 2 Reihen)
// wie beim serverseitigen Compositing in lib/card-render.ts, damit Web-Karte
// und Apple-/Google-Wallet-Pass optisch identisch wirken.
function StampGrid({
  count,
  filledCount,
  justEarned,
  design,
  accentColor,
}: {
  count: number;
  filledCount: number;
  justEarned: number;
  design: CardDesign;
  accentColor: string;
}) {
  const cols = count > 6 ? Math.ceil(count / 2) : count;
  const iconPath = stampIconPath(design.stampIconKey);
  return (
    // w-full ist hier Pflicht: ohne explizite Breite ist der Flex-Container
    // selbst "auto"-groß (wird nur von place-items-center zentriert, nicht
    // gestreckt) - Prozent-Breiten auf den Zellen lösen sich dann gegen eine
    // unbestimmte Basis auf, wodurch die Icons zu groß gerendert werden und
    // eine dritte, angeschnittene Zeile über den Bannerrand hinausragt.
    <div className="flex flex-wrap justify-center content-center gap-2 w-full h-full">
      {Array.from({ length: count }).map((_, i) => {
        const filled = i < filledCount;
        const isNew = filled && i >= filledCount - justEarned;
        return (
          <div
            key={i}
            className="shrink-0"
            style={{ width: `${100 / cols}%`, maxWidth: 60, minWidth: 30 }}
          >
            <div
              className={`relative aspect-square rounded-full grid place-items-center transition-all duration-300 ${
                isNew ? "stamp-pop" : ""
              }`}
              style={
                filled
                  ? { background: "rgba(255,255,255,0.97)" }
                  : { background: "rgba(255,255,255,0.14)", border: "1.5px solid rgba(255,255,255,0.45)" }
              }
            >
              {design.stampIconImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={design.stampIconImage}
                  alt=""
                  className="w-[64%] h-[64%] object-cover rounded-full"
                  style={{ opacity: filled ? 1 : 0.55 }}
                />
              ) : (
                <svg viewBox="0 0 24 24" className="w-[54%] h-[54%]" style={{ opacity: filled ? 1 : 0.6 }}>
                  <path d={iconPath} fill={filled ? accentColor : "#FFFFFF"} />
                </svg>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function WalletCard(p: Props) {
  const d = resolveDesign(p.design);
  const isStamp = p.type === "stamp";
  const current = isStamp ? p.stamps : p.points;
  const target = isStamp ? p.stampsRequired : p.pointsPerReward;
  const remaining = Math.max(0, target - current);
  const ready = current >= target && target > 0;

  const baseStyle = cardBaseStyle(d);
  const textColor = cardTextColor(d);
  const dim = textColor === "#FFFFFF" ? "rgba(255,255,255,0.72)" : "rgba(20,20,20,0.65)";
  const faintFill = textColor === "#FFFFFF" ? "rgba(255,255,255,0.16)" : "rgba(20,20,20,0.1)";
  const strongFill = textColor === "#FFFFFF" ? "rgba(255,255,255,0.94)" : "rgba(20,20,20,0.88)";
  const strongFillText = textColor === "#FFFFFF" ? "#141414" : "#FFFFFF";
  const accentColor = themeColorHex(d);
  const justEarned = Math.max(0, p.justEarned ?? 0);

  const logoTransform = `translate(${d.logoOffsetX}%, ${d.logoOffsetY}%) scale(${d.logoScale})`;
  const hasBanner = Boolean(d.bannerImage);

  return (
    <div
      data-card-root
      className={`relative p-5 shadow-2xl w-[340px] max-w-full overflow-hidden ${CORNER_RADIUS_CLASS[d.cornerRadius]}`}
      style={{ ...baseStyle, color: textColor }}
    >
      <div className="relative flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest" style={{ color: dim }}>
            Treuekarte
          </div>
          <div className="text-lg font-bold -mt-0.5 truncate">{p.title}</div>
        </div>
        <div
          className="w-14 h-14 rounded-2xl grid place-items-center font-extrabold text-lg overflow-hidden shrink-0 shadow-lg"
          style={{ background: faintFill }}
        >
          <div className="w-full h-full grid place-items-center" style={{ transform: logoTransform }}>
            {d.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.logoImage} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              d.logo
            )}
          </div>
        </div>
      </div>

      {/* Banner/Stempel-Bereich */}
      <div
        className="relative my-4 rounded-2xl overflow-hidden"
        style={{
          aspectRatio: "1125 / 369",
          ...(hasBanner
            ? { backgroundImage: `url(${d.bannerImage})`, backgroundSize: "cover", backgroundPosition: `center ${d.bannerFocalY}%` }
            : baseStyle),
        }}
      >
        {hasBanner && (
          <div className="absolute inset-0 pointer-events-none" style={{ background: bannerOverlayGradient(d) }} />
        )}
        {!hasBanner && <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(0,0,0,0.12)" }} />}

        <div className="relative w-full h-full grid place-items-center px-4">
          {isStamp ? (
            <StampGrid
              count={p.stampsRequired}
              filledCount={p.stamps}
              justEarned={justEarned}
              design={d}
              accentColor={accentColor}
            />
          ) : (
            <div className="w-full px-2">
              <div className="text-center text-3xl font-extrabold text-white drop-shadow">{p.points}</div>
              <div className="text-center text-xs text-white/80 mb-2">von {p.pointsPerReward} Punkten</div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.25)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, (p.points / p.pointsPerReward) * 100)}%`, background: "#FFFFFF" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fortschritt: sofort erkennbar, unabhängig vom Stempelraster */}
      <div className="relative mb-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-extrabold tracking-tight">
            {current} <span className="text-sm font-semibold" style={{ color: dim }}>
              von {target} {isStamp ? "Stempeln" : "Punkten"}
            </span>
          </span>
        </div>
        {ready ? (
          <div
            className="mt-2 rounded-xl px-3 py-2 text-sm font-semibold reward-ready-glow"
            style={{ background: strongFill, color: strongFillText }}
          >
            ✓ Belohnung frei: {p.reward}
          </div>
        ) : (
          <div className="text-sm font-medium mt-1" style={{ color: dim }}>
            Noch {remaining} bis zur Belohnung · {p.reward}
          </div>
        )}
      </div>

      <div className="relative bg-white rounded-xl p-3 flex items-center gap-3">
        {p.qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.qrDataUrl} alt="QR-Code" className="w-[74px] h-[74px] rounded" />
        ) : (
          <div className="w-[74px] h-[74px] rounded bg-neutral-200" />
        )}
        <div className="min-w-0">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Karten-ID</div>
          <div className="font-mono text-xs text-black break-all">{p.serial.slice(0, 8).toUpperCase()}</div>
        </div>
      </div>
    </div>
  );
}
