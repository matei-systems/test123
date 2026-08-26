"use client";

import { useRef } from "react";

// Dezenter Lichtschein, der der Maus innerhalb der Karte folgt - typisches
// Detail hochwertiger Marketing-Seiten. Reine CSS-Custom-Properties statt
// State/Re-Render pro Mausbewegung (Performance), deshalb kein useState hier.
// Auf Touch-Geräten greift kein :hover, die Regel in landing.css blendet den
// Effekt dort ohnehin aus - hier also nichts weiter zu tun.
export default function SpotlightCard({
  children,
  className = "",
  style,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  const Component = Tag as any;
  return (
    <Component ref={ref} onMouseMove={onMove} className={`lp-spotlight ${className}`} style={style}>
      {children}
    </Component>
  );
}
