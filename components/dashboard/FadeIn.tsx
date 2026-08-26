"use client";

import { usePathname } from "next/navigation";

// Sanftes Einblenden des Seiteninhalts bei jeder Navigation innerhalb des
// Dashboards - nutzt die bereits vorhandene .enter-Klasse (app/globals.css,
// respektiert prefers-reduced-motion). Der key=pathname sorgt dafür, dass
// React den Wrapper bei jedem Seitenwechsel neu mountet, sonst würde die
// Animation (die nur beim Mount feuert) nach der ersten Seite nicht mehr
// erneut auslösen, weil dieser Wrapper im Layout liegt und Layouts bei
// Client-seitiger Navigation bestehen bleiben.
export default function FadeIn({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="enter">
      {children}
    </div>
  );
}
