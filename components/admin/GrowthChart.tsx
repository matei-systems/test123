"use client";

import { useState } from "react";

// Einzelne Kennzahl (Neuanmeldungen/Tag) über die Zeit -> ein Sequenzial-Farbton
// (Gold, wie im übrigen Produkt), keine kategoriale Farbzuordnung nötig.
// Dünne Balken mit abgerundeten Enden, 2px Lücke, Hover-Tooltip pro Balken -
// siehe dataviz-Richtlinien (marks-and-anatomy / interaction).
export default function GrowthChart({ data }: { data: { date: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const width = 760;
  const height = 160;
  const gap = 3;
  const barW = data.length > 0 ? (width - gap * (data.length - 1)) / data.length : 0;

  function fmtDate(iso: string): string {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold tracking-tight">Neuanmeldungen (letzte 30 Tage)</h2>
        <span className="text-xs text-dim">{total} gesamt</span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[140px]" role="img" aria-label={`${total} Neuanmeldungen in den letzten 30 Tagen`}>
          {data.map((d, i) => {
            const barH = Math.max(2, (d.count / max) * (height - 20));
            const x = i * (barW + gap);
            const y = height - barH;
            const isHover = hover === i;
            return (
              <rect
                key={d.date}
                x={x}
                y={y}
                width={Math.max(1, barW)}
                height={barH}
                rx={Math.min(3, barW / 2)}
                fill={isHover ? "#F6D19A" : "#E8B573"}
                opacity={isHover ? 1 : 0.85}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              >
                <title>{`${fmtDate(d.date)}: ${d.count} ${d.count === 1 ? "Neuanmeldung" : "Neuanmeldungen"}`}</title>
              </rect>
            );
          })}
        </svg>
        {hover !== null && data[hover] && (
          <div
            className="absolute -top-1 px-2 py-1 rounded-md text-xs font-medium pointer-events-none"
            style={{
              left: `${(hover / data.length) * 100}%`,
              transform: "translate(-50%, -100%)",
              background: "#1A1620",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#F4F1EC",
              whiteSpace: "nowrap",
            }}
          >
            {fmtDate(data[hover].date)}: {data[hover].count}
          </div>
        )}
      </div>
      <div className="flex justify-between text-[11px] text-faint mt-2">
        <span>{data[0] ? fmtDate(data[0].date) : ""}</span>
        <span>{data[data.length - 1] ? fmtDate(data[data.length - 1].date) : ""}</span>
      </div>
    </div>
  );
}
