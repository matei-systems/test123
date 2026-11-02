"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRedemptionStatus } from "@/app/konto/actions";

function fmtLeft(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function RedeemCodeLive({
  requestId,
  cardId,
  qrSvg,
  shortCode,
  expiresAt,
  rewardTitle,
  costLabel,
  businessName,
  initialStatus,
  newCodeForm,
}: {
  requestId: string;
  cardId: string;
  qrSvg: string;
  shortCode: string;
  expiresAt: string;
  rewardTitle: string;
  costLabel: string;
  businessName: string;
  initialStatus: string;
  newCodeForm: React.ReactNode;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [now, setNow] = useState(() => Date.now());
  const left = new Date(expiresAt).getTime() - now;
  const effective = status === "pending" && left <= 0 ? "expired" : status;

  useEffect(() => {
    if (effective !== "pending") return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(async () => {
      try {
        const res = await getRedemptionStatus(requestId);
        setStatus(res.status);
      } catch {
        // Netzwerk kurz weg - nächster Versuch in 3 s.
      }
    }, 3000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [effective, requestId]);

  if (effective === "used") {
    return (
      <div role="status" className="card p-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest text-on-forest" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-8 w-8 stamp-pop" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold">Eingelöst!</h1>
        <p className="mt-2 text-muted">
          {rewardTitle} bei {businessName}. Viel Freude damit!
        </p>
        <Link href={`/konto/karten/${cardId}`} className="btn btn-primary mt-6">
          Zurück zur Karte
        </Link>
      </div>
    );
  }

  if (effective !== "pending") {
    return (
      <div role="status" className="card p-8 text-center">
        <h1 className="font-display text-3xl font-semibold">{effective === "cancelled" ? "Code ersetzt" : "Code abgelaufen"}</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted">
          {effective === "cancelled"
            ? "Für diese Karte wurde inzwischen ein neuer Code erzeugt. Es gilt immer nur der neueste."
            : "Einlöse-Codes gelten 10 Minuten. Dein Guthaben wurde nicht abgezogen – erzeuge einfach einen neuen Code."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {newCodeForm}
          <Link href={`/konto/karten/${cardId}`} className="btn btn-ghost">
            Zurück zur Karte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="bg-forest px-6 py-5 text-on-forest">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">{businessName}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold">{rewardTitle}</h1>
        <p className="text-sm opacity-85">Kosten: {costLabel}</p>
      </div>
      <div className="flex flex-col items-center gap-5 p-6 text-center">
        <p className="text-[15px] text-muted">Zeig diesen Code an der Kasse. Das Geschäft scannt ihn oder tippt den Kurzcode ein.</p>
        <div className="w-60 max-w-full rounded-2xl border border-line bg-white p-3" dangerouslySetInnerHTML={{ __html: qrSvg }} role="img" aria-label="Einlöse-QR-Code" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Kurzcode</p>
          <p className="mt-1 font-mono text-[34px] font-bold tracking-[0.18em] text-fg" aria-label={`Kurzcode ${shortCode.split("").join(" ")}`}>
            {shortCode.slice(0, 3)} {shortCode.slice(3)}
          </p>
        </div>
        <p className={`badge ${left < 60_000 ? "badge-danger" : "badge-accent"} text-sm`} aria-live="polite">
          Noch {fmtLeft(left)} gültig
        </p>
        <p className="text-sm text-faint">Erst beim Einlösen durch das Geschäft wird das Guthaben abgezogen. Der Code ist nur einmal verwendbar.</p>
        <Link href={`/konto/karten/${cardId}`} className="btn btn-ghost btn-sm">
          Zurück zur Karte
        </Link>
      </div>
    </div>
  );
}
