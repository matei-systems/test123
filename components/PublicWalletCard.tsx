"use client";

import { useEffect, useState } from "react";
import WalletCard from "@/components/WalletCard";

type Props = Omit<React.ComponentProps<typeof WalletCard>, "justEarned">;

// Client-Wrapper nur für die animierte "neuer Stempel seit letztem Besuch"-
// Optik: rendert beim ersten Paint IDENTISCH zum Server (justEarned=0, sonst
// Hydration-Mismatch), vergleicht danach in einem Effekt gegen den zuletzt
// gesehenen Stand in localStorage und lässt die neuen Zellen erst dann
// einfliegen - dieselbe Erfahrung wie beim erneuten Öffnen von Stocard & Co.
export default function PublicWalletCard(props: Props) {
  const [justEarned, setJustEarned] = useState(0);

  useEffect(() => {
    const key = `matei_seen_${props.type}_${props.serial}`;
    const current = props.type === "stamp" ? props.stamps : props.points;
    const seenRaw = localStorage.getItem(key);
    if (seenRaw !== null && props.type === "stamp") {
      const seen = Number(seenRaw);
      if (current > seen) setJustEarned(current - seen);
    }
    localStorage.setItem(key, String(current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <WalletCard {...props} justEarned={justEarned} />;
}
