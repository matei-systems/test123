"use client";

import { useRef, useState } from "react";
import { uploadCardImage } from "@/app/dashboard/programs/upload-actions";

const CONFIG = {
  logo: { maxDim: 320, mime: "image/png" as const, quality: undefined, label: "Logo" },
  banner: { maxDim: 1400, mime: "image/jpeg" as const, quality: 0.88, label: "Bannerbild" },
  icon: { maxDim: 400, mime: "image/png" as const, quality: undefined, label: "Eigenes Stempel-Icon" },
};

// Skaliert clientseitig auf eine sinnvolle Zielgröße, misst bei Hintergrund-
// bildern zusätzlich die durchschnittliche Helligkeit (für den automatischen
// Kontrast-Overlay, siehe lib/contrast.ts) und liefert beides zusammen mit
// dem hochladefertigen Blob zurück - alles in einem Canvas-Durchlauf.
type UploadKind = "logo" | "banner" | "icon";

function processImage(file: File, kind: UploadKind): Promise<{ blob: Blob; luminance?: number }> {
  const { maxDim, mime, quality } = CONFIG[kind];
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

        let luminance: number | undefined;
        if (kind === "banner") {
          const { data } = ctx.getImageData(0, 0, w, h);
          let sum = 0;
          const step = 4 * 37; // grobes Sampling reicht, spart Rechenzeit bei großen Bildern
          let n = 0;
          for (let i = 0; i < data.length; i += step) {
            const r = data[i] / 255,
              g = data[i + 1] / 255,
              b = data[i + 2] / 255;
            sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
            n++;
          }
          luminance = n > 0 ? sum / n : 0.4;
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Bild konnte nicht verarbeitet werden."));
            resolve({ blob, luminance });
          },
          mime,
          quality
        );
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function ImageUpload({
  value,
  onChange,
  kind,
  aspect = "square",
}: {
  value: string | null;
  onChange: (url: string | null, luminance?: number) => void;
  kind: UploadKind;
  aspect?: "square" | "wide";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Bitte wähle eine Bilddatei (PNG, JPG oder WEBP).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { blob, luminance } = await processImage(file, kind);
      const fd = new FormData();
      const ext = CONFIG[kind].mime === "image/png" ? "png" : "jpg";
      fd.append("file", blob, `upload.${ext}`);
      const res = await uploadCardImage(fd);
      if (res.error) {
        setError(res.error);
      } else if (res.url) {
        onChange(res.url, luminance);
      }
    } catch (e: any) {
      setError(e.message ?? "Bild konnte nicht verarbeitet werden.");
    } finally {
      setBusy(false);
    }
  }

  const previewShape = aspect === "wide" ? "w-full aspect-[1.6/1] rounded-xl" : "w-16 h-16 rounded-xl shrink-0";

  return (
    <div>
      <div className={aspect === "wide" ? "space-y-3" : "flex items-center gap-4"}>
        <div className={`bg-ink border border-line grid place-items-center overflow-hidden ${previewShape}`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={`${CONFIG[kind].label}-Vorschau`} className="w-full h-full object-cover" />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-faint">
              <rect x="4" y="4" width="16" height="16" rx="3" />
              <circle cx="9" cy="10" r="1.5" />
              <path d="M4 16l4.5-4.5a2 2 0 012.8 0L18 18" />
            </svg>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn btn-ghost text-sm">
            {busy ? "Wird hochgeladen…" : value ? `${CONFIG[kind].label} ändern` : `${CONFIG[kind].label} hochladen`}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="btn btn-ghost text-sm">
              Entfernen
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          aria-label={`${CONFIG[kind].label} Datei auswählen`}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <div className="text-xs text-[#FCA5A5] mt-2">{error}</div>}
      {!value && kind === "logo" && <div className="text-xs text-faint mt-2">Ohne Upload wird der Logo-Buchstabe verwendet.</div>}
    </div>
  );
}
