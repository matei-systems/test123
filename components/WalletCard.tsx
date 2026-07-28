import { themeGradient } from "@/lib/themes";

interface Props {
  title: string;
  logo: string;
  theme: number;
  type: "stamp" | "points";
  stamps: number;
  stampsRequired: number;
  points: number;
  pointsPerReward: number;
  reward: string;
  serial: string;
  qrDataUrl?: string;
}

export default function WalletCard(p: Props) {
  const ready =
    p.type === "stamp"
      ? p.stamps >= p.stampsRequired
      : p.points >= p.pointsPerReward;

  return (
    <div className="rounded-2xl p-5 text-white shadow-2xl w-[340px] max-w-full"
         style={{ background: themeGradient(p.theme) }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest opacity-80">Treuekarte</div>
          <div className="text-lg font-bold -mt-0.5">{p.title}</div>
        </div>
        <div className="w-9 h-9 rounded-lg grid place-items-center font-extrabold bg-white/20">
          {p.logo}
        </div>
      </div>

      <div className="my-5">
        {p.type === "stamp" ? (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: p.stampsRequired }).map((_, i) => {
              const filled = i < p.stamps;
              return (
                <div key={i}
                     className={
                       "aspect-square rounded-full grid place-items-center text-xs " +
                       (filled
                         ? "bg-white text-black"
                         : "border border-dashed border-white/40 text-white/60")
                     }>
                  {filled ? "✓" : i + 1}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl font-extrabold">{p.points}</div>
            <div className="text-xs opacity-80">von {p.pointsPerReward} Punkten</div>
            <div className="h-2 rounded-full bg-white/25 mt-3 overflow-hidden">
              <div className="h-full bg-white rounded-full"
                   style={{ width: `${Math.min(100, (p.points / p.pointsPerReward) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {ready ? (
        <div className="bg-white text-black rounded-xl px-3 py-2 text-sm font-semibold">
          ✓ Belohnung frei: {p.reward}
        </div>
      ) : (
        <div className="text-xs opacity-85">Belohnung: {p.reward}</div>
      )}

      <div className="bg-white rounded-xl p-3 mt-4 flex items-center gap-3">
        {p.qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.qrDataUrl} alt="QR-Code" className="w-[74px] h-[74px] rounded" />
        ) : (
          <div className="w-[74px] h-[74px] rounded bg-neutral-200" />
        )}
        <div className="min-w-0">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Karten-ID</div>
          <div className="font-mono text-xs text-black break-all">
            {p.serial.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
