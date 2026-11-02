import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main id="inhalt" className="min-h-screen bg-ink text-fg flex items-center justify-center px-4 py-10 sm:p-6 relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-40"
        style={{ background: "radial-gradient(closest-side, rgb(var(--accent-strong) / 0.14), transparent 70%)" }}
      />
      <div className="w-full max-w-[400px] relative">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card p-6 sm:p-8">
          <div className="text-[11px] font-bold tracking-[2.5px] uppercase text-gold mb-2">{eyebrow}</div>
          <h1 className="font-display text-[28px] font-semibold leading-tight mb-1">{title}</h1>
          {subtitle && <p className="text-dim text-sm mb-6">{subtitle}</p>}
          {!subtitle && <div className="mb-6" />}
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-faint">{footer}</div>}

        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-faint">
          <Link href="/impressum" className="hover:text-gold-bright">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-gold-bright">
            Datenschutz
          </Link>
          <Link href="/agb" className="hover:text-gold-bright">
            AGB
          </Link>
        </div>
      </div>
    </main>
  );
}
