"use client";

import { useEffect, useRef, useState } from "react";
import WalletCard from "@/components/WalletCard";

type Props = Omit<React.ComponentProps<typeof WalletCard>, "justEarned">;

const POLL_MS = 4000;

// Client-Wrapper mit zwei Aufgaben:
//  1) Beim ersten Öffnen: vergleicht gegen den zuletzt gesehenen Stand in
//     localStorage und lässt neue Stempel einfliegen (z. B. Kunde öffnet die
//     Seite erneut, nachdem er zwischenzeitlich gestempelt wurde).
//  2) Solange die Seite geöffnet bleibt: fragt alle paar Sekunden den
//     aktuellen Stand ab (nur während der Tab sichtbar ist) - so sieht ein
//     Kunde, der seine Karte am Tresen offen hält, den neuen Stempel von
//     selbst, ohne manuell neu zu laden. Bewusst einfaches Polling statt
//     Supabase Realtime/WebSockets - für eine Handvoll Sekunden Latenz reicht
//     das, ohne zusätzliche Infrastruktur.
export default function PublicWalletCard(props: Props) {
  const [stamps, setStamps] = useState(props.stamps);
  const [points, setPoints] = useState(props.points);
  const [justEarned, setJustEarned] = useState(0);
  const seenRef = useRef<number | null>(null);

  useEffect(() => {
    const key = `matei_seen_${props.type}_${props.serial}`;
    const current = props.type === "stamp" ? props.stamps : props.points;
    const seenRaw = localStorage.getItem(key);
    if (seenRaw !== null && props.type === "stamp") {
      const seen = Number(seenRaw);
      if (current > seen) setJustEarned(current - seen);
    }
    seenRef.current = current;
    localStorage.setItem(key, String(current));

    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      if (!stopped && !document.hidden) {
        try {
          const res = await fetch(`/api/cards/${props.serial}/status`, { cache: "no-store" });
          if (res.ok) {
            const data: { stamps: number; points: number } = await res.json();
            const next = props.type === "stamp" ? data.stamps : data.points;
            if (seenRef.current !== null && next > seenRef.current) {
              if (props.type === "stamp") setJustEarned(next - seenRef.current);
              seenRef.current = next;
              localStorage.setItem(key, String(next));
            }
            setStamps(data.stamps);
            setPoints(data.points);
          }
        } catch {
          // Nächster Versuch folgt automatisch - kein Fehler an den Kunden zeigen.
        }
      }
      if (!stopped) timer = setTimeout(poll, POLL_MS);
    }
    timer = setTimeout(poll, POLL_MS);

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <WalletCard {...props} stamps={stamps} points={points} justEarned={justEarned} />;
}
