import Link from "next/link";

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
    <main className="min-h-screen bg-ink text-[#F4F1EC] flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-40"
        style={{ background: "radial-gradient(closest-side, rgba(232,181,115,0.14), transparent 70%)" }}
      />
      <div className="w-full max-w-sm relative">
        <Link href="/" className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg grid place-items-center font-extrabold text-[#241a0c] bg-gold-grad shadow-[0_4px_14px_rgba(219,159,82,0.4)]">
            M
          </div>
          <div className="font-bold tracking-tight text-[15px]">Matei&nbsp;Loyalty</div>
        </Link>

        <div className="bg-auth-surface border border-line rounded-2xl p-8">
          <div className="text-[11px] font-bold tracking-[2.5px] uppercase text-gold mb-2">{eyebrow}</div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">{title}</h1>
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
