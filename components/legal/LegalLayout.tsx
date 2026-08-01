import Link from "next/link";

export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-ink text-[#F4F1EC] px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg grid place-items-center font-extrabold text-[#241a0c] bg-gold-grad shrink-0">
            M
          </div>
          <span className="font-bold tracking-tight text-[15px]">Matei&nbsp;Loyalty</span>
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight mb-1">{title}</h1>
        <p className="text-faint text-xs mb-8">Stand: {updated}</p>

        <div className="space-y-6 text-sm leading-relaxed text-[#D9D5CC] [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-[#F4F1EC] [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-gold [&_a:hover]:text-gold-bright">
          {children}
        </div>

        <div className="mt-12 pt-6 border-t border-line flex gap-4 text-xs text-faint">
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
