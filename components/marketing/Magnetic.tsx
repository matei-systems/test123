"use client";

import { useRef } from "react";

// Zieht sein Kind sanft in Richtung Mauszeiger, solange man darüber schwebt -
// federt beim Verlassen zurück auf null. Nur für Call-to-Action-Buttons
// gedacht, deshalb absichtlich sehr klein dosiert (strength in px). Reagiert
// nicht auf Touch (kein mousemove dort) und wird bei reduced-motion komplett
// deaktiviert, weil die Bewegung sonst unangenehm wirken kann.
export default function Magnetic({
  children,
  strength = 10,
  className = "",
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reduced.current = true;
      return;
    }
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * strength;
    const y = ((e.clientY - r.top) / r.height - 0.5) * strength;
    el.style.transform = `translate(${x}px, ${y}px)`;
  }

  function onLeave() {
    const el = ref.current;
    if (el) el.style.transform = "translate(0, 0)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`inline-block transition-transform duration-200 ease-out will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
