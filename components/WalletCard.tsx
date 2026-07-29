import { resolveDesign, cardBackground, cardTextColor, CORNER_RADIUS_CLASS, type CardDesign } from "@/lib/card-design";

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

export default function WalletCard(p: Props) {
  const d = resolveDesign(p.design);
  const ready = p.type === "stamp" ? p.stamps >= p.stampsRequired : p.points >= p.pointsPerReward;
  const { style: bgStyle, overlay } = cardBackground(d);
  const textColor = cardTextColor(d);
  const dim = textColor === "#FFFFFF" ? "rgba(255,255,255,0.72)" : "rgba(20,20,20,0.65)";
  const faintFill = textColor === "#FFFFFF" ? "rgba(255,255,255,0.16)" : "rgba(20,20,20,0.1)";
  const strongFill = textColor === "#FFFFFF" ? "rgba(255,255,255,0.94)" : "rgba(20,20,20,0.88)";
  const strongFillText = textColor === "#FFFFFF" ? "#141414" : "#FFFFFF";
  const justEarned = Math.max(0, p.justEarned ?? 0);

  const logoTransform = `translate(${d.logoOffsetX}%, ${d.logoOffsetY}%) scale(${d.logoScale})`;

  return (
    <div
      data-card-root
      className={`relative p-5 shadow-2xl w-[340px] max-w-full overflow-hidden ${CORNER_RADIUS_CLASS[d.cornerRadius]}`}
      style={{ ...bgStyle, color: textColor }}
    >
      {overlay && <div className="absolute inset-0 pointer-events-none" style={{ background: overlay }} />}

      <div className="relative flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest" style={{ color: dim }}>
            Treuekarte
          </div>
          <div className="text-lg font-bold -mt-0.5 truncate">{p.title}</div>
        </div>
        <div
          className="w-9 h-9 rounded-lg grid place-items-center font-extrabold overflow-hidden shrink-0"
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

      <div className="relative my-5">
        {p.type === "stamp" ? (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: p.stampsRequired }).map((_, i) => {
              const filled = i < p.stamps;
              const isNew = filled && i >= p.stamps - justEarned;
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-xl grid place-items-center text-sm transition-colors duration-300 ${isNew ? "stamp-pop" : ""}`}
                  style={
                    filled
                      ? { background: strongFill, color: strongFillText }
                      : { border: `1.5px dashed ${faintFill}`, color: dim }
                  }
                >
                  {filled ? d.stampIcon : i + 1}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl font-extrabold">{p.points}</div>
            <div className="text-xs" style={{ color: dim }}>
              von {p.pointsPerReward} Punkten
            </div>
            <div className="h-2 rounded-full mt-3 overflow-hidden" style={{ background: faintFill }}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, (p.points / p.pointsPerReward) * 100)}%`, background: strongFill }}
              />
            </div>
          </div>
        )}
      </div>

      {ready ? (
        <div
          className="relative rounded-xl px-3 py-2 text-sm font-semibold reward-ready-glow"
          style={{ background: strongFill, color: strongFillText }}
        >
          ✓ Belohnung frei: {p.reward}
        </div>
      ) : (
        <div className="relative text-xs" style={{ color: dim }}>
          Belohnung: {p.reward}
        </div>
      )}

      <div className="relative bg-white rounded-xl p-3 mt-4 flex items-center gap-3">
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
