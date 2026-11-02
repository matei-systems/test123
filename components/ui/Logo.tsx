import Link from "next/link";

// Logo nach Canva-Markenleitfaden: runder Stempel mit "m" + Wortmarke "matei".
// Reines SVG/HTML, skaliert scharf und folgt dem Farbschema.
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <circle cx="24" cy="24" r="23" fill="rgb(var(--accent-strong))" />
      <circle cx="24" cy="24" r="19.5" fill="none" stroke="rgb(var(--on-accent))" strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="2.2 2.4" />
      <path
        d="M14.5 31V20.6c0-.5.4-.9.9-.9h1.6c.5 0 .9.4.9.9v.9c.9-1.3 2.3-2.1 4-2.1 1.8 0 3.1.8 3.8 2.3.9-1.5 2.4-2.3 4.2-2.3 2.9 0 4.6 1.9 4.6 5.1V31c0 .5-.4.9-.9.9h-1.9c-.5 0-.9-.4-.9-.9v-5.9c0-1.6-.7-2.4-2-2.4-1.4 0-2.3 1-2.3 2.6V31c0 .5-.4.9-.9.9h-1.9c-.5 0-.9-.4-.9-.9v-5.9c0-1.6-.7-2.4-2-2.4-1.4 0-2.3 1-2.3 2.6V31c0 .5-.4.9-.9.9h-1.9c-.5 0-.9-.4-.9-.9Z"
        fill="rgb(var(--on-accent))"
      />
    </svg>
  );
}

export default function Logo({ href = "/", size = 32, label = "Matei Systems – Startseite" }: { href?: string | null; size?: number; label?: string }) {
  const inner = (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="font-display text-[22px] font-semibold leading-none tracking-tight text-fg">matei</span>
    </span>
  );
  if (href === null) return inner;
  return (
    <Link href={href} aria-label={label} className="inline-flex rounded-full">
      {inner}
    </Link>
  );
}
