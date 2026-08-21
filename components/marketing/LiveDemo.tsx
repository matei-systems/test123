"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import WalletCard from "@/components/WalletCard";
import { THEMES } from "@/lib/themes";
import { DEFAULT_DESIGN, type CardDesign } from "@/lib/card-design";
import { useThemeLang } from "@/components/marketing/ThemeLangProvider";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB - reine Client-Vorschau, kein Upload

// Skaliert ein hochgeladenes Bild clientseitig auf eine kleine Vorschaugröße
// und liefert es als data:-URL zurück - bewusst OHNE Server-Roundtrip: hier
// lädt ein anonymer Website-Besucher ein beliebiges Bild hoch, das darf
// nirgends gespeichert werden (Storage-Kosten, Missbrauchsrisiko). Bleibt
// komplett im Browser-Speicher dieser einen Sitzung.
function readAsScaledDataUrl(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.onload = () => {
      img.onerror = () => reject(new Error("Das ist kein gültiges Bild."));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Bild konnte nicht verarbeitet werden."));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function LiveDemo() {
  const { t } = useThemeLang();
  const [name, setName] = useState("Café Central");
  const [type, setType] = useState<"stamp" | "points">("stamp");
  const [reward, setReward] = useState("1 Gratis-Kaffee");
  const [themeIndex, setThemeIndex] = useState(0);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [stampIconImage, setStampIconImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    QRCode.toDataURL("https://matei.systems/c/demo", { margin: 1, width: 160, color: { dark: "#111111", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, []);

  async function handleUpload(file: File | undefined, kind: "logo" | "stamp") {
    if (!file) return;
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Bitte wähle eine Bilddatei.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("Datei ist zu groß (max. 8 MB).");
      return;
    }
    try {
      const dataUrl = await readAsScaledDataUrl(file, kind === "logo" ? 200 : 240);
      if (kind === "logo") setLogoImage(dataUrl);
      else setStampIconImage(dataUrl);
    } catch (e: any) {
      setUploadError(e.message ?? "Bild konnte nicht verarbeitet werden.");
    }
  }

  const design: CardDesign = useMemo(
    () => ({
      ...DEFAULT_DESIGN,
      gradientFrom: THEMES[themeIndex].from,
      gradientTo: THEMES[themeIndex].to,
      logo: (name.trim()[0] || "C").toUpperCase(),
      logoImage,
      stampIconImage,
    }),
    [themeIndex, name, logoImage, stampIconImage]
  );

  return (
    <div className="grid grid-cols-1 gap-[50px] lg:grid-cols-[1fr_340px] items-start">
      <div className="card p-6 min-w-0">
        <h4 className="text-[13px] uppercase tracking-wide text-dim font-bold mb-5">{t.demo.panelTitle}</h4>
        <div className="mb-4">
          <label className="label">{t.demo.nameLabel}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
        </div>
        <div className="mb-4">
          <label className="label">{t.demo.typeLabel}</label>
          <div className="inline-flex bg-[color:var(--lp-bg)] border border-line rounded-xl p-1 gap-1">
            {(["stamp", "points"] as const).map((ty) => (
              <button
                key={ty}
                type="button"
                onClick={() => setType(ty)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === ty ? "bg-white/[0.08] text-[color:var(--lp-text)]" : "text-faint hover:text-[color:var(--lp-text)]"
                }`}
              >
                {ty === "stamp" ? t.demo.typeStamp : t.demo.typePoints}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="label">{t.demo.rewardLabel}</label>
          <input className="input" value={reward} onChange={(e) => setReward(e.target.value)} maxLength={40} />
        </div>
        <div className="mb-4">
          <label className="label">{t.demo.colorLabel}</label>
          <div className="flex gap-2.5 flex-wrap">
            {THEMES.map((th, i) => (
              <button
                key={th.name}
                type="button"
                onClick={() => setThemeIndex(i)}
                title={th.name}
                aria-label={th.name}
                className={`w-9 h-9 rounded-[10px] transition-transform hover:scale-105 ${
                  themeIndex === i ? "ring-2 ring-white ring-offset-2 ring-offset-[color:var(--lp-surface)]" : ""
                }`}
                style={{ background: `linear-gradient(140deg, ${th.from}, ${th.to})` }}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t.demo.logoLabel}</label>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-[color:var(--lp-bg)] border border-line grid place-items-center overflow-hidden shrink-0">
                {logoImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-faint text-xs">{(name.trim()[0] || "C").toUpperCase()}</span>
                )}
              </div>
              <button type="button" onClick={() => logoInputRef.current?.click()} className="btn btn-ghost text-xs px-3 py-2">
                {t.demo.logoUpload}
              </button>
              {logoImage && (
                <button type="button" onClick={() => setLogoImage(null)} className="text-xs text-faint hover:text-gold-bright">
                  {t.demo.logoRemove}
                </button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0], "logo")}
            />
          </div>
          <div>
            <label className="label">{t.demo.stampIconLabel}</label>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-[color:var(--lp-bg)] border border-line grid place-items-center overflow-hidden shrink-0">
                {stampIconImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={stampIconImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-faint text-xs">✓</span>
                )}
              </div>
              <button type="button" onClick={() => stampInputRef.current?.click()} className="btn btn-ghost text-xs px-3 py-2">
                {t.demo.stampIconUpload}
              </button>
              {stampIconImage && (
                <button type="button" onClick={() => setStampIconImage(null)} className="text-xs text-faint hover:text-gold-bright">
                  {t.demo.logoRemove}
                </button>
              )}
            </div>
            <input
              ref={stampInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0], "stamp")}
            />
          </div>
        </div>
        {uploadError && <div className="text-xs mt-2" style={{ color: "var(--lp-rose)" }}>{uploadError}</div>}
      </div>

      <div className="lg:sticky lg:top-24 min-w-0">
        <div className="text-center text-faint text-xs tracking-wide mb-3.5">{t.demo.previewCaption.toUpperCase()}</div>
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
        <div className="text-center text-faint text-[11px] mt-3">{t.demo.previewNote}</div>
      </div>
    </div>
  );
}
