"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import WalletCard from "@/components/WalletCard";
import { THEMES } from "@/lib/themes";
import { DEFAULT_DESIGN, type CardDesign, type BaseMode } from "@/lib/card-design";
import { useTheme } from "@/components/marketing/ThemeProvider";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB - reine Client-Vorschau, kein Upload

// Schneidet ein hochgeladenes Bild clientseitig mittig auf ein Quadrat zu
// und skaliert es danach auf eine kleine Vorschaugröße - ohne den
// quadratischen Zuschnitt vorab sieht ein hochformatiges/querformatiges
// Foto im runden Stempel-Icon (object-cover + rounded-full in WalletCard)
// oft schief/außermittig aus. Bewusst OHNE Server-Roundtrip: hier lädt ein
// anonymer Website-Besucher ein beliebiges Bild hoch, das darf nirgends
// gespeichert werden (Storage-Kosten, Missbrauchsrisiko) - bleibt komplett
// im Browser-Speicher dieser einen Sitzung.
function readAsSquareDataUrl(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.onload = () => {
      img.onerror = () => reject(new Error("Das ist kein gültiges Bild."));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Bild konnte nicht verarbeitet werden."));
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={valid ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg border border-line bg-transparent cursor-pointer shrink-0"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input font-mono text-sm"
          maxLength={7}
          placeholder="#3B2A20"
        />
      </div>
    </div>
  );
}

export default function LiveDemo() {
  const { t } = useTheme();
  const [name, setName] = useState("Café Central");
  const [type, setType] = useState<"stamp" | "points">("stamp");
  const [reward, setReward] = useState("1 Gratis-Kaffee");
  const [baseMode, setBaseMode] = useState<BaseMode>("gradient");
  const [gradientFrom, setGradientFrom] = useState(THEMES[0].from);
  const [gradientTo, setGradientTo] = useState(THEMES[0].to);
  const [solidColor, setSolidColor] = useState("#3B2A20");
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
      const dataUrl = await readAsSquareDataUrl(file, kind === "logo" ? 240 : 300);
      if (kind === "logo") setLogoImage(dataUrl);
      else setStampIconImage(dataUrl);
    } catch (e: any) {
      setUploadError(e.message ?? "Bild konnte nicht verarbeitet werden.");
    }
  }

  function pickTheme(i: number) {
    setGradientFrom(THEMES[i].from);
    setGradientTo(THEMES[i].to);
    setBaseMode("gradient");
  }

  const design: CardDesign = useMemo(
    () => ({
      ...DEFAULT_DESIGN,
      baseMode,
      gradientFrom,
      gradientTo,
      solidColor,
      logo: (name.trim()[0] || "C").toUpperCase(),
      logoImage,
      stampIconImage,
    }),
    [baseMode, gradientFrom, gradientTo, solidColor, name, logoImage, stampIconImage]
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

        <div className="mb-4 pt-1">
          <label className="label">{t.demo.baseModeLabel}</label>
          <div className="inline-flex bg-[color:var(--lp-bg)] border border-line rounded-xl p-1 gap-1 mb-3">
            {(["gradient", "color"] as BaseMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setBaseMode(m)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  baseMode === m ? "bg-white/[0.08] text-[color:var(--lp-text)]" : "text-faint hover:text-[color:var(--lp-text)]"
                }`}
              >
                {m === "gradient" ? t.demo.baseModeGradient : t.demo.baseModeColor}
              </button>
            ))}
          </div>

          {baseMode === "gradient" ? (
            <div className="space-y-3">
              <div className="flex gap-2.5 flex-wrap">
                {THEMES.map((th, i) => (
                  <button
                    key={th.name}
                    type="button"
                    onClick={() => pickTheme(i)}
                    title={th.name}
                    aria-label={th.name}
                    className={`w-9 h-9 rounded-[10px] transition-transform hover:scale-105 ${
                      gradientFrom === th.from && gradientTo === th.to ? "ring-2 ring-white ring-offset-2 ring-offset-[color:var(--lp-surface)]" : ""
                    }`}
                    style={{ background: `linear-gradient(140deg, ${th.from}, ${th.to})` }}
                  />
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ColorField label={t.demo.gradientFromLabel} value={gradientFrom} onChange={setGradientFrom} />
                <ColorField label={t.demo.gradientToLabel} value={gradientTo} onChange={setGradientTo} />
              </div>
            </div>
          ) : (
            <ColorField label={t.demo.colorLabel} value={solidColor} onChange={setSolidColor} />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-line">
          <div className="pt-4">
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
          <div className="pt-4">
            <label className="label">{t.demo.stampIconLabel}</label>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[color:var(--lp-bg)] border border-line grid place-items-center overflow-hidden shrink-0">
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
        {uploadError && (
          <div className="text-xs mt-2" style={{ color: "var(--lp-rose)" }}>
            {uploadError}
          </div>
        )}
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
