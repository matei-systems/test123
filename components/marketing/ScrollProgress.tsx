"use client";

import { useEffect, useRef } from "react";

// Hauchdünne Fortschrittsleiste direkt unter der Nav - füllt sich beim
// Herunterscrollen. Läuft komplett über rAF + direkte Style-Mutation statt
// useState, damit hier kein Re-Render pro Scroll-Event entsteht.
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`;
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none">
      <div ref={barRef} className="h-full origin-left bg-gold-grad" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
