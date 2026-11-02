import { resolveDesign, cardBaseStyle, cardTextColor } from "@/lib/card-design";
import { costText } from "@/lib/programs";
import type { WalletCard } from "@/lib/konto";

export function StampGrid({ filled, total, size = "md" }: { filled: number; total: number; size?: "sm" | "md" }) {
  const cols = total <= 5 ? total : total <= 10 ? 5 : total <= 12 ? 6 : 8;
  return (
    <ol
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      aria-label={`${Math.min(filled, total)} von ${total} Stempeln`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const on = i < filled;
        return (
          <li
            key={i}
            aria-hidden="true"
            className={`grid aspect-square place-items-center rounded-full font-bold ${size === "sm" ? "text-[10px]" : "text-xs"} ${
              on ? "bg-stamp text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.15)]" : "border-2 border-dashed border-line-2 text-faint"
            }`}
          >
            {on ? (
              <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth={3.2}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              i + 1
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function ProgressBar({ value, max, tone = "stamp" }: { value: number; max: number; tone?: "stamp" | "forest" }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-fg/[0.07]" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)}>
      <div className={`h-full rounded-full ${tone === "forest" ? "bg-forest" : "bg-stamp"} transition-[width] duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function CardHeader({ card, large = false }: { card: WalletCard; large?: boolean }) {
  const design = resolveDesign(card.program?.design);
  const name = card.business?.display_name ?? "Geschäft";
  return (
    <div className={`flex items-center gap-3 ${large ? "p-6" : "p-4"}`} style={{ ...cardBaseStyle(design), color: cardTextColor(design) }}>
      <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-white/15 font-bold ${large ? "h-14 w-14 text-lg" : "h-11 w-11"}`}>
        {card.business?.logo_url || design.logoImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(card.business?.logo_url || design.logoImage) as string} alt="" className="h-full w-full object-cover" />
        ) : (
          design.logo || name.slice(0, 1).toUpperCase()
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate font-semibold ${large ? "text-lg" : "text-[15px]"}`}>{name}</span>
        <span className="block truncate text-[13px] opacity-80">{card.program?.title || card.program?.name}</span>
      </span>
      {card.readyRewards.length > 0 && (
        <span className="badge shrink-0 bg-white/90 text-[#1F5A45]">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Bereit
        </span>
      )}
    </div>
  );
}

export function balanceLine(card: WalletCard) {
  const p = card.program;
  if (!p) return "";
  if (p.type === "stamp") return `${Math.min(card.stamps, p.stamps_required)} von ${p.stamps_required} Stempeln`;
  return `${card.points} ${card.points === 1 ? "Punkt" : "Punkte"}`;
}

export function nextLine(card: WalletCard) {
  const p = card.program;
  if (!p) return "";
  if (card.readyRewards.length > 0) {
    const r = card.readyRewards[card.readyRewards.length - 1];
    return card.readyRewards.length === 1 ? `Belohnung bereit: ${r.title}` : `${card.readyRewards.length} Belohnungen bereit`;
  }
  if (card.nextReward) {
    const missing = card.nextReward.cost_points - card.balance;
    return `Noch ${costText(p.type, missing)} bis ${card.nextReward.title}`;
  }
  return p.active ? "Sammle weiter – Belohnungen siehst du in der Karte." : "Programm pausiert";
}

export default function WalletCardView({ card }: { card: WalletCard }) {
  const p = card.program;
  const goal = card.nextReward?.cost_points ?? card.readyRewards[card.readyRewards.length - 1]?.cost_points ?? (p?.type === "stamp" ? p.stamps_required : p?.points_per_reward ?? 1);
  return (
    <div className="card card-hover flex h-full flex-col overflow-hidden">
      <CardHeader card={card} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-display text-xl font-semibold tabular">{balanceLine(card)}</span>
          {card.activeMultiplier > 1 && <span className="badge badge-accent">Aktion ×{card.activeMultiplier}</span>}
        </div>
        {p?.type === "stamp" ? (
          <StampGrid filled={Math.min(card.stamps, p.stamps_required)} total={Math.min(p.stamps_required, 16)} size="sm" />
        ) : (
          <ProgressBar value={card.balance} max={goal} tone={card.readyRewards.length > 0 ? "forest" : "stamp"} />
        )}
        <p className={`mt-auto text-sm ${card.readyRewards.length > 0 ? "font-semibold text-forest" : "text-muted"}`}>{nextLine(card)}</p>
        {card.status === "inactive" && <p className="text-sm font-semibold text-danger">Karte deaktiviert</p>}
      </div>
    </div>
  );
}
