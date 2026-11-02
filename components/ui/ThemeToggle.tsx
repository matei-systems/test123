"use client";

import { useColorScheme } from "@/components/ui/useColorScheme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { scheme, toggle } = useColorScheme();
  const dark = scheme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Helles Design aktivieren" : "Dunkles Design aktivieren"}
      title={dark ? "Helles Design" : "Dunkles Design"}
      className={`inline-grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition hover:border-accent-strong hover:text-accent ${className}`}
    >
      {dark ? (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
