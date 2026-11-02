// Marken-Illustrationen nach den Canva-Entwürfen (App-Screens, Aufsteller).
// Reines SVG/HTML statt Bilddateien: scharf, leicht, folgt dem Farbschema.
// Alle Inhalte sind sichtbar als Beispiel gekennzeichnet - es werden keine
// echten Geschäfte oder Kundendaten dargestellt.

export function TextStamp({ size = 132, className = "", spin = true }: { size?: number; className?: string; spin?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      <g className={spin ? "spin-slow" : ""} style={{ transformOrigin: "60px 60px" }}>
        <defs>
          <path id="stamp-circle" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
        </defs>
        <circle cx="60" cy="60" r="57" fill="none" stroke="rgb(var(--stamp))" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="33" fill="none" stroke="rgb(var(--stamp))" strokeWidth="1.2" strokeDasharray="2 3" />
        <text fill="rgb(var(--stamp))" fontSize="11.5" fontWeight="700" letterSpacing="3.2" style={{ fontFamily: "var(--font-sans)" }}>
          <textPath href="#stamp-circle">TREUE ZAHLT SICH AUS • TREUE ZAHLT SICH AUS •</textPath>
        </text>
      </g>
      <path
        d="M60 74s-13-7.6-13-16.4c0-4.2 3.2-7.1 6.9-7.1 2.6 0 4.8 1.4 6.1 3.5 1.3-2.1 3.5-3.5 6.1-3.5 3.7 0 6.9 2.9 6.9 7.1C73 66.4 60 74 60 74Z"
        fill="rgb(var(--stamp))"
      />
    </svg>
  );
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// Stempelkarte im Handy (Canva: "Wallet" / "Kartendetail")
export function PhoneStampCard({ filled = 7, total = 10, className = "" }: { filled?: number; total?: number; className?: string }) {
  return (
    <div className={`relative mx-auto w-[280px] sm:w-[300px] ${className}`} role="img" aria-label={`Beispiel einer digitalen Stempelkarte: ${filled} von ${total} Stempeln`}>
      <div className="rounded-[44px] border border-line-2 bg-surface p-3 shadow-lift">
        <div className="overflow-hidden rounded-[34px] bg-paper">
          <div className="flex items-center justify-between px-6 pb-2 pt-4 text-[11px] font-semibold text-fg tabular">
            <span>9:41</span>
            <span className="h-[18px] w-[72px] rounded-full bg-fg/90" aria-hidden="true" />
            <span className="flex gap-1" aria-hidden="true">
              <span className="h-2 w-3 rounded-sm bg-fg/70" />
              <span className="h-2 w-4 rounded-sm bg-fg/70" />
            </span>
          </div>
          <div className="px-4 pb-5 pt-2">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-xl font-semibold">Wallet</span>
              <span className="badge badge-muted">Beispiel</span>
            </div>
            <div className="rounded-[22px] bg-forest p-4 text-on-forest shadow-soft">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-on-forest/15 font-display text-base font-semibold">C</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold leading-tight">Café am Eck</div>
                  <div className="text-[11px] opacity-80">Kaffeekarte</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {Array.from({ length: total }).map((_, i) => (
                  <span
                    key={i}
                    className={`grid aspect-square place-items-center rounded-full text-[11px] font-bold ${
                      i < filled ? "bg-[#E9B872] text-[#3A2508]" : "border-[1.5px] border-dashed border-on-forest/45 text-on-forest/60"
                    }`}
                  >
                    {i < filled ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-75">Stand</div>
                  <div className="font-display text-2xl font-semibold leading-none tabular">
                    {filled} <span className="text-base opacity-80">von {total}</span>
                  </div>
                </div>
                <div className="text-right text-[11px] leading-snug opacity-90">
                  Noch {total - filled} bis
                  <br />
                  <strong>Gratis Cappuccino</strong>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-[18px] border border-line bg-surface p-3">
              <QrGlyph className="h-14 w-14 shrink-0 text-fg" />
              <div className="text-[12px] leading-snug text-muted">
                <strong className="block text-[13px] text-fg">An der Kasse vorzeigen</strong>
                Das Geschäft scannt deinen Code und vergibt den Stempel.
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -right-6 hidden rotate-[-4deg] sm:block">
        <div className="ticket flex items-center gap-2 px-4 py-2.5 shadow-lift">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-forest text-on-forest">
            <Check className="h-3.5 w-3.5" />
          </span>
          <span className="text-[13px] font-semibold">Belohnung bereit</span>
        </div>
      </div>
    </div>
  );
}

// Stilisiertes QR-Symbol (kein echter Code - nur Illustration)
export function QrGlyph({ className = "" }: { className?: string }) {
  const cells = [
    "1111111010111", "1000001011001", "1011101001101", "1011101110001", "1011101010111", "1000001001001",
    "1111111010101", "0000000110100", "1101011101110", "0110100010011", "1011011101101", "0100110010110", "1110101101011",
  ];
  return (
    <svg viewBox="0 0 13 13" className={className} shapeRendering="crispEdges" aria-hidden="true">
      {cells.flatMap((row, y) =>
        row.split("").map((c, x) => (c === "1" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" /> : null))
      )}
    </svg>
  );
}

// Nummerierter Ring-Schritt (Canva: "1-2-3")
export function StepRing({ n }: { n: number }) {
  return (
    <span className="relative grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-stamp/70 font-display text-2xl font-semibold text-accent">
      {n}
    </span>
  );
}

// Wallet-Liste (Canva: App-Screen "Wallet" mit Tab-Leiste)
export function PhoneWalletList({ className = "" }: { className?: string }) {
  const cards = [
    { name: "Café am Eck", sub: "7 von 10 Stempeln", tone: "bg-forest text-on-forest", progress: 70, ready: false, initial: "C" },
    { name: "Bäckerei Beispiel", sub: "240 Punkte", tone: "bg-accent-strong text-on-accent", progress: 48, ready: false, initial: "B" },
    { name: "Salon Muster", sub: "10 von 10 Stempeln", tone: "bg-fg text-paper", progress: 100, ready: true, initial: "S" },
  ];
  return (
    <div className={`relative mx-auto w-[280px] sm:w-[300px] ${className}`} role="img" aria-label="Beispiel einer Wallet mit drei Treuekarten verschiedener Geschäfte">
      <div className="rounded-[44px] border border-line-2 bg-surface p-3 shadow-lift">
        <div className="overflow-hidden rounded-[34px] bg-paper">
          <div className="px-5 pb-3 pt-6">
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl font-semibold">Wallet</span>
              <span className="badge badge-muted">Beispiel</span>
            </div>
            <p className="mt-1 text-[12px] text-muted">3 Karten · getrennter Stand je Geschäft</p>
          </div>
          <ul className="space-y-2.5 px-4">
            {cards.map((c) => (
              <li key={c.name} className="rounded-[18px] border border-line bg-surface p-3">
                <div className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-base font-semibold ${c.tone}`}>{c.initial}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{c.name}</div>
                    <div className="text-[12px] text-muted tabular">{c.sub}</div>
                  </div>
                  {c.ready && <span className="badge badge-forest !px-2 text-[10px]">Bereit</span>}
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-fg/[0.07]">
                  <div className={`h-full rounded-full ${c.ready ? "bg-forest" : "bg-stamp"}`} style={{ width: `${c.progress}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-4 border-t border-line px-2 py-3 text-center text-[10px] font-semibold text-faint">
            {["Wallet", "Entdecken", "Verlauf", "Profil"].map((t, i) => (
              <span key={t} className={i === 0 ? "text-accent" : ""}>
                <span className={`mx-auto mb-1 block h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-accent" : "bg-transparent"}`} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
