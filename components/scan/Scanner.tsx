"use client";

import { useCallback, useRef, useState } from "react";
import { CameraMessage, useQrCamera } from "@/components/scan/useQrCamera";
import {
  lookupScan,
  lookupShortCode,
  scanEarn,
  scanRedeemCode,
  scanRedeemReward,
  type ScanResult,
  type ScannedCard,
  type ScannedCode,
} from "@/app/dashboard/scan/actions";

const fmtEuro = (n: number | null) => (n === null ? "" : new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(n));
const unit = (type: string, n: number) => (type === "stamp" ? "Stempel" : n === 1 ? "Punkt" : "Punkte");

function newRequestId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Scanner() {
  const [card, setCard] = useState<ScannedCard | null>(null);
  const [code, setCode] = useState<ScannedCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [amount, setAmount] = useState("");
  const [confirmReward, setConfirmReward] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const requestId = useRef(newRequestId());

  const apply = useCallback((res: ScanResult) => {
    if ("error" in res) {
      setError(res.error);
      return false;
    }
    setError(null);
    if (res.kind === "card") {
      setCard(res.card);
      setCode(null);
    } else {
      setCode(res.code);
      setCard(null);
    }
    return true;
  }, []);

  const resumeRef = useRef<() => void>(() => {});
  const onCode = useCallback(
    async (text: string) => {
      const ok = apply(await lookupScan(text));
      if (!ok) setTimeout(() => resumeRef.current(), 1800);
    },
    [apply]
  );
  const { videoRef, canvasRef, status, resume } = useQrCamera(onCode);
  resumeRef.current = resume;

  function reset() {
    setCard(null);
    setCode(null);
    setError(null);
    setFlash(null);
    setAmount("");
    setConfirmReward(null);
    requestId.current = newRequestId();
    resume();
  }

  function done(message: string) {
    setFlash(message);
    requestId.current = newRequestId();
    setTimeout(reset, 1600);
  }

  async function earn() {
    if (!card) return;
    let purchase: number | null = null;
    if (card.earningMode === "amount") {
      purchase = Number(amount.replace(",", "."));
      if (!amount || !Number.isFinite(purchase) || purchase < 0) {
        setError("Bitte gib den Einkaufsbetrag an.");
        return;
      }
    }
    setPending(true);
    const res = await scanEarn(card.id, purchase, requestId.current);
    setPending(false);
    if ("error" in res) return setError(res.error);
    done(res.message ?? "Gebucht");
  }

  async function redeemFromCard(rewardId: string) {
    if (!card) return;
    setPending(true);
    const res = await scanRedeemReward(card.id, rewardId, requestId.current);
    setPending(false);
    setConfirmReward(null);
    if ("error" in res) return setError(res.error);
    done(res.message ?? "Eingelöst");
  }

  async function redeemCode() {
    if (!code) return;
    setPending(true);
    const res = await scanRedeemCode(code.token, requestId.current);
    setPending(false);
    if (res.error) return setError(res.error);
    done(res.message ?? "Eingelöst");
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    apply(await lookupShortCode(manual));
    setPending(false);
  }

  const overlay = card || code || flash;

  return (
    <div className="mx-auto max-w-md">
      <div className="relative aspect-square overflow-hidden rounded-card bg-[#14110F]">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        {status === "scanning" && !overlay && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="aspect-square w-2/3 rounded-3xl border-2 border-white/80" style={{ boxShadow: "0 0 0 999px rgba(0,0,0,0.35)" }} />
          </div>
        )}
        <CameraMessage status={status} />

        {overlay && (
          <div className="enter absolute inset-0 flex flex-col overflow-y-auto bg-surface">
            {flash ? (
              <div role="status" className="m-auto p-6 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest text-on-forest">
                  <svg viewBox="0 0 24 24" className="stamp-pop h-8 w-8" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <p className="mt-4 font-display text-2xl font-semibold">{flash}</p>
              </div>
            ) : card ? (
              <>
                <div className="bg-forest px-5 py-4 text-on-forest">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">{card.programTitle}</p>
                  <p className="font-display text-xl font-semibold">{card.customerName}</p>
                  <p className="text-sm opacity-90 tabular">
                    {card.type === "stamp" ? `${card.balance} / ${card.stampsRequired} Stempel` : `${card.balance} Punkte`}
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-center text-sm font-medium text-danger">{error}</p>}
                  {!card.programActive && <p className="text-center text-sm font-semibold text-warn">Programm ist pausiert.</p>}
                  {card.earningMode === "amount" && (
                    <div>
                      <label htmlFor="scan-amount" className="label">
                        Einkaufsbetrag in €{" "}
                        {card.type === "stamp" ? `(ab ${fmtEuro(card.minPurchaseAmount)} = 1 Stempel)` : `(${fmtEuro(card.amountPerPoint)} = 1 Punkt)`}
                      </label>
                      <input
                        id="scan-amount"
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="z. B. 12,50"
                        className="input text-center text-lg"
                        autoFocus
                      />
                    </div>
                  )}
                  <button type="button" disabled={pending} onClick={earn} className="btn btn-forest btn-lg w-full">
                    {pending ? "Wird gebucht …" : card.type === "stamp" ? "+1 Stempel" : card.earningMode === "amount" ? "Punkte buchen" : "+10 Punkte"}
                  </button>

                  {card.rewards.length > 0 && (
                    <div className="mt-1">
                      <p className="label">Belohnung einlösen</p>
                      <ul className="space-y-2">
                        {card.rewards.map((r) => (
                          <li key={r.id}>
                            {confirmReward === r.id ? (
                              <div className="rounded-xl border border-accent-strong/40 bg-accent-strong/5 p-3">
                                <p className="text-sm font-semibold">
                                  „{r.title}“ für {r.cost} {unit(card.type, r.cost)} einlösen?
                                </p>
                                {r.conditions && <p className="mt-1 text-xs text-muted">Bedingung: {r.conditions}</p>}
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <button type="button" disabled={pending} onClick={() => redeemFromCard(r.id)} className="btn btn-primary btn-sm">
                                    {pending ? "…" : "Ja, einlösen"}
                                  </button>
                                  <button type="button" disabled={pending} onClick={() => setConfirmReward(null)} className="btn btn-ghost btn-sm">
                                    Abbrechen
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={pending || !r.available}
                                onClick={() => setConfirmReward(r.id)}
                                className="flex w-full items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 text-left text-sm transition hover:border-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
                              >
                                <span className="font-medium">{r.title}</span>
                                <span className={`shrink-0 tabular ${r.available ? "font-semibold text-accent" : "text-faint"}`}>
                                  {r.available ? `${r.cost} ${unit(card.type, r.cost)}` : `noch ${r.cost - card.balance}`}
                                </span>
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button type="button" disabled={pending} onClick={reset} className="btn btn-ghost mt-auto w-full">
                    Nächster Kunde
                  </button>
                </div>
              </>
            ) : code ? (
              <>
                <div className="bg-accent-strong px-5 py-4 text-on-accent">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Einlöse-Code {code.shortCode}</p>
                  <p className="font-display text-xl font-semibold">{code.rewardTitle}</p>
                  <p className="text-sm opacity-90">
                    {code.customerName} · kostet {code.cost} {unit(code.type, code.cost)} · Stand {code.balance}
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-center text-sm font-medium text-danger">{error}</p>}
                  <p className="text-sm text-muted">Bitte die Belohnung übergeben und dann bestätigen. Der Code ist danach verbraucht.</p>
                  <button type="button" disabled={pending} onClick={redeemCode} className="btn btn-primary btn-lg w-full">
                    {pending ? "Wird eingelöst …" : "Einlösung bestätigen"}
                  </button>
                  <button type="button" disabled={pending} onClick={reset} className="btn btn-ghost mt-auto w-full">
                    Abbrechen
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {error && !overlay && (
        <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-center text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <form onSubmit={submitManual} className="mt-5 flex gap-2">
        <label htmlFor="manual-code" className="sr-only">Kurzcode eingeben</label>
        <input
          id="manual-code"
          value={manual}
          onChange={(e) => setManual(e.target.value.toUpperCase())}
          placeholder="Kurzcode, z. B. ABC 234"
          className="input font-mono uppercase tracking-[0.12em]"
          maxLength={9}
          autoComplete="off"
        />
        <button type="submit" disabled={pending || manual.replace(/[^A-Za-z0-9]/g, "").length !== 6} className="btn btn-dark shrink-0">
          Prüfen
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-faint">
        Kundenkarte oder Einlöse-Code in den Rahmen halten. Jede Buchung wird serverseitig geprüft und protokolliert.
      </p>
    </div>
  );
}
