"use client";

import { useEffect, useRef, useState } from "react";

type Variant = "up" | "scale" | "left" | "right";

const HIDDEN: Record<Variant, string> = {
  up: "opacity-0 translate-y-6",
  scale: "opacity-0 scale-[0.94]",
  left: "opacity-0 -translate-x-6",
  right: "opacity-0 translate-x-6",
};
const SHOWN: Record<Variant, string> = {
  up: "opacity-100 translate-y-0",
  scale: "opacity-100 scale-100",
  left: "opacity-100 translate-x-0",
  right: "opacity-100 translate-x-0",
};

// Sanftes Einblenden von Sektionen beim Scrollen - rein optischer Effekt für
// die Marketing-Seite, kein Layout-Einfluss (startet unsichtbar/leicht
// verschoben, blendet beim ersten Sichtbarwerden endgültig ein). Respektiert
// prefers-reduced-motion, indem einfach sofort "in" gesetzt wird.
export default function Reveal({
  children,
  delayMs = 0,
  className = "",
  variant = "up",
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
  variant?: Variant;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.unobserve(el);
        }
      },
      { threshold: 0.14 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? SHOWN[variant] : HIDDEN[variant]} ${className}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
