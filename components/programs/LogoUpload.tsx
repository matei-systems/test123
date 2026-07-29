"use client";

import { useRef, useState } from "react";

const MAX_DIM = 160;
const MAX_BYTES = 400_000; // ~400KB data-URL ceiling stored in the design jsonb column

// Resizes/compresses client-side so a phone photo doesn't get uploaded as-is -
// loyalty card logos only ever render at ~36-44px, there is no reason to ship
// a multi-MB original into the database.
function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.onload = () => {
      img.onerror = () => reject(new Error("Das ist kein gültiges Bild."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Bild konnte nicht verarbeitet werden."));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png", 0.9));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function LogoUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Bitte wähle eine Bilddatei (PNG, JPG, SVG als Rastergrafik).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await resizeToDataUrl(file);
      if (dataUrl.length > MAX_BYTES) {
        setError("Das Bild ist auch verkleinert noch zu groß. Bitte ein einfacheres Logo versuchen.");
      } else {
        onChange(dataUrl);
      }
    } catch (e: any) {
      setError(e.message ?? "Bild konnte nicht verarbeitet werden.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-ink border border-line grid place-items-center overflow-hidden shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Logo-Vorschau" className="w-full h-full object-cover" />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-faint">
              <rect x="4" y="4" width="16" height="16" rx="3" />
              <circle cx="9" cy="10" r="1.5" />
              <path d="M4 16l4.5-4.5a2 2 0 012.8 0L18 18" />
            </svg>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="btn btn-ghost text-sm"
          >
            {busy ? "Wird verarbeitet…" : value ? "Logo ändern" : "Logo hochladen"}
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
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <div className="text-xs text-[#FCA5A5] mt-2">{error}</div>}
      {!value && <div className="text-xs text-faint mt-2">Ohne Upload wird der Logo-Buchstabe verwendet.</div>}
    </div>
  );
}
