"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { CameraMessage, useQrCamera } from "@/components/scan/useQrCamera";

// Erkennt Matei-Codes: Beitritts-QR am Tresen (/j/<programm>) und
// Kartenlinks (/c/<serial>). Fremde Links werden NICHT geöffnet.
function matchMateiPath(text: string): string | null {
  try {
    const url = new URL(text.trim());
    const own = typeof window !== "undefined" ? window.location.host : "";
    const trusted = url.host === own || url.host === "matei.systems" || url.host.endsWith(".matei.systems");
    if (!trusted) return null;
    const m = url.pathname.match(/^\/(j|c)\/([A-Za-z0-9-]{8,64})\/?$/);
    return m ? `/${m[1]}/${m[2]}` : null;
  } catch {
    return null;
  }
}

export default function CustomerScanner() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const onCode = useCallback(
    (text: string) => {
      const path = matchMateiPath(text);
      if (path) {
        setMessage("Code erkannt – wird geöffnet …");
        router.push(path);
        return;
      }
      setMessage("Das ist kein Matei-Code. Halte den QR-Code am Tresen des Geschäfts in den Rahmen.");
      setTimeout(() => {
        setMessage(null);
        resumeRef();
      }, 2200);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router]
  );
  const { videoRef, canvasRef, status, resume } = useQrCamera(onCode);
  function resumeRef() {
    resume();
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="relative aspect-square overflow-hidden rounded-card bg-[#14110F]">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        {status === "scanning" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="aspect-square w-2/3 rounded-3xl border-2 border-white/80" style={{ boxShadow: "0 0 0 999px rgba(0,0,0,0.35)" }} />
          </div>
        )}
        <CameraMessage status={status} />
      </div>
      <p aria-live="polite" className={`mt-4 min-h-[24px] text-center text-sm ${message ? "font-semibold text-fg" : "text-faint"}`}>
        {message ?? "Halte den QR-Code am Tresen in den Rahmen."}
      </p>
    </div>
  );
}
