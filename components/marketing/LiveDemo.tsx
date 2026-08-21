"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import WalletCard from "@/components/WalletCard";
import { THEMES } from "@/lib/themes";
import { DEFAULT_DESIGN, type CardDesign } from "@/lib/card-design";

// Interaktiver Mini-Editor für die Landingpage: dieselbe WalletCard-Komponente
// wie im echten Produkt, damit die Vorschau hier zu 100% dem entspricht, was
// ein Kunde später tatsächlich bekommt - keine separat gepflegte Nachbildung.
export default function LiveDemo() {
  const [name, setName] = useState("Café Central");
  const [type, setType] = useState<"stamp" | "points">("stamp");
  const [reward, setReward] = useState("1 Gratis-Kaffee");
  const [themeIndex, setThemeIndex] = useState(0);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL("https://matei.systems/c/demo", { margin: 1, width: 160, color: { dark: "#111111", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, []);

  const design: CardDesign = useMemo(
    () => ({
      ...DEFAULT_DESIGN,
      gradientFrom: THEMES[themeIndex].from,
      gradientTo: THEMES[themeIndex].to,
      logo: (name.trim()[0] || "C").toUpperCase(),
    }),
    [themeIndex, name]
  );

  return (
    <div className="grid grid-cols-1 gap-[50px] lg:grid-cols-[1fr_340px] items-start">
      <div className="card p-6 min-w-0">
        <h4 className="text-[13px] uppercase tracking-wide text-dim font-bold mb-5">Deine Karte gestalten</h4>
        <div className="mb-4">
          <label className="label">Name deines Betriebs</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
        </div>
        <div className="mb-4">
          <label className="label">Karten-Typ</label>
          <div className="inline-flex bg-ink border border-line rounded-xl p-1 gap-1">
            {(["stamp", "points"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === t ? "bg-white/[0.08] text-[#F4F1EC]" : "text-faint hover:text-[#F4F1EC]"
                }`}
              >
                {t === "stamp" ? "Stempel" : "Punkte"}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="label">Belohnung</label>
          <input className="input" value={reward} onChange={(e) => setReward(e.target.value)} maxLength={40} />
        </div>
        <div>
          <label className="label">Kartenfarbe</label>
          <div className="flex gap-2.5 flex-wrap">
            {THEMES.map((t, i) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setThemeIndex(i)}
                title={t.name}
                aria-label={t.name}
                className={`w-9 h-9 rounded-[10px] transition-transform hover:scale-105 ${
                  themeIndex === i ? "ring-2 ring-white ring-offset-2 ring-offset-[#16131A]" : ""
                }`}
                style={{ background: `linear-gradient(140deg, ${t.from}, ${t.to})` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 min-w-0">
        <div className="text-center text-faint text-xs tracking-wide mb-3.5">SO SIEHT&apos;S IM HANDY DEINES KUNDEN AUS</div>
        <div className="flex justify-center overflow-x-auto">
          <WalletCard
            title={name || "Dein Betrieb"}
            design={design}
            type={type}
            stamps={type === "stamp" ? 7 : 0}
            stampsRequired={10}
            points={type === "points" ? 140 : 0}
            pointsPerReward={200}
            reward={reward || "Deine Belohnung"}
            serial="demo"
            qrDataUrl={qr ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
