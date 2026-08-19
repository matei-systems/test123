"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { lookupScannedCard, scanStamp, scanAddPoints, scanRedeem, type ScannedCard } from "@/app/dashboard/scan/actions";

type Status = "starting" | "scanning" | "denied" | "unsupported";

export default function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Refs, nicht State: der rAF-Loop unten ist eine einzige stabile Closure
  // über die gesamte Kamera-Session hinweg und darf nicht auf veralteten
  // React-State zugreifen - busyRef ist die einzige Quelle der Wahrheit
  // dafür, ob gerade ein erkannter Code verarbeitet wird.
  const busyRef = useRef(false);
  const rafRef = useRef<number>();

  const [status, setStatus] = useState<Status>("starting");
  const [card, setCard] = useState<ScannedCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;

    async function handleScan(text: string) {
      const res = await lookupScannedCard(text);
      if (stopped) return;
      if (res.error) {
        setError(res.error);
        busyRef.current = false;
        return;
      }
      setError(null);
      setCard(res.card ?? null);
      // busyRef bleibt true, bis reset() (nach "Abbrechen" oder nach
      // erfolgreicher Aktion) den Scan-Loop wieder freigibt.
    }

    function tick() {
      if (stopped) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !busyRef.current) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            busyRef.current = true;
            handleScan(code.data);
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
        setStatus("scanning");
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => setStatus("denied"));

    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function reset() {
    setCard(null);
    setError(null);
    setFlash(null);
    setAmount("");
    busyRef.current = false;
  }

  async function act(
    action: (id: string, purchaseAmount?: number) => Promise<{ error?: string; card?: ScannedCard }>,
    successMsg: string
  ) {
    if (!card) return;
    let purchaseAmount: number | undefined;
    if (card.earningMode === "amount") {
      purchaseAmount = Number(amount.replace(",", "."));
      if (!amount || Number.isNaN(purchaseAmount) || purchaseAmount < 0) {
        setError("Bitte gib den Einkaufsbetrag an.");
        return;
      }
    }
    setPending(true);
    const res = await action(card.id, purchaseAmount);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setCard(res.card ?? null);
    setFlash(successMsg);
    setTimeout(() => reset(), 1400);
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />

        {status === "scanning" && !card && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="w-2/3 aspect-square border-2 border-white/70 rounded-2xl" style={{ boxShadow: "0 0 0 999px rgba(0,0,0,0.35)" }} />
          </div>
        )}

        {status === "starting" && (
          <div className="absolute inset-0 grid place-items-center text-sm text-[#A6A099] bg-ink">Kamera wird gestartet…</div>
        )}
        {status === "denied" && (
          <div className="absolute inset-0 grid place-items-center text-center text-sm text-[#FCA5A5] bg-ink p-6">
            Kein Kamerazugriff. Bitte in den Browser-Einstellungen erlauben und neu laden.
          </div>
        )}
        {status === "unsupported" && (
          <div className="absolute inset-0 grid place-items-center text-center text-sm text-[#FCA5A5] bg-ink p-6">
            Dieses Gerät/dieser Browser unterstützt keinen Kamerazugriff.
          </div>
        )}

        {card && (
          <div className="absolute inset-0 bg-ink/95 backdrop-blur-sm flex flex-col justify-center p-5 enter">
            {flash ? (
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-500/20 text-emerald-400 grid place-items-center text-2xl">✓</div>
                <div className="text-[#F4F1EC] font-semibold">{flash}</div>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="text-xs uppercase tracking-wide text-gold mb-1">{card.programTitle}</div>
                  <div className="text-lg font-bold text-[#F4F1EC]">{card.customerName}</div>
                  <div className="text-sm text-[#A6A099] mt-1">
                    {card.type === "stamp" ? `${card.stamps} / ${card.stampsRequired} Stempel` : `${card.points} / ${card.pointsPerReward} Punkte`}
                    {card.ready && <span className="ml-2 text-emerald-400">· Belohnung frei</span>}
                  </div>
                </div>
                {error && (
                  <div className="mb-3 text-sm rounded-lg px-3 py-2 text-center" style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
                    {error}
                  </div>
                )}
                {card.earningMode === "amount" && (
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={
                      card.type === "stamp"
                        ? `Einkaufsbetrag (ab ${(card.minPurchaseAmount ?? 0).toFixed(2)} € = 1 Stempel)`
                        : `Einkaufsbetrag (${(card.amountPerPoint ?? 0).toFixed(2)} € = 1 Punkt)`
                    }
                    className="input mb-2 text-center"
                    aria-label="Einkaufsbetrag in Euro"
                  />
                )}
                <div className="flex flex-col gap-2">
                  {card.type === "stamp" ? (
                    <button disabled={pending} onClick={() => act(scanStamp, "Stempel vergeben!")} className="btn btn-primary">
                      {pending ? "…" : "+ Stempel geben"}
                    </button>
                  ) : (
                    <button disabled={pending} onClick={() => act(scanAddPoints, "Punkte vergeben!")} className="btn btn-primary">
                      {pending ? "…" : card.earningMode === "amount" ? "Punkte berechnen & buchen" : "+ 10 Punkte geben"}
                    </button>
                  )}
                  <button
                    disabled={pending || !card.ready}
                    onClick={() => act(scanRedeem, "Belohnung eingelöst!")}
                    className="btn btn-ghost"
                  >
                    {pending ? "…" : `Einlösen: ${card.rewardDescription}`}
                  </button>
                  <button disabled={pending} onClick={reset} className="btn btn-ghost text-sm mt-1">
                    Abbrechen
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && !card && (
        <div className="mt-4 text-sm rounded-lg px-3 py-2 text-center" style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
          {error}
        </div>
      )}

      <p className="text-center text-xs text-faint mt-4">
        QR-Code der Kundenkarte in den Rahmen halten — Stempeln/Einlösen läuft danach automatisch für den nächsten Kunden weiter.
      </p>
    </div>
  );
}
