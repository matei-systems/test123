import PublicShell, { Container } from "@/components/site/PublicShell";
import { fmtDate } from "@/lib/programs";

// Rahmen der Rechtsseiten (Impressum, Datenschutz, AGB, AVV) im
// einheitlichen Seitenlayout. Hinweis: Die Texte sind vorbereitet und sollten
// vor dem Echtbetrieb rechtlich geprüft werden (siehe docs/ABSCHLUSSBERICHT.md).
export default function LegalLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <PublicShell>
      <Container className="py-12 md:py-16">
        <article className="mx-auto max-w-3xl">
          <p className="eyebrow">Rechtliches</p>
          <h1 className="mt-3 font-display text-[36px] font-semibold leading-tight sm:text-[44px]">{title}</h1>
          <p className="mt-2 text-sm text-faint">Stand: {/^\d{4}-\d{2}-\d{2}$/.test(updated) ? fmtDate(updated) : updated}</p>
          <div className="mt-10 space-y-6 text-[16px] leading-relaxed text-fg [&_a]:font-medium [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-accent-hover [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:text-fg [&_p]:mb-3 [&_p]:text-muted [&_strong]:text-fg [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:text-muted">
            {children}
          </div>
        </article>
      </Container>
    </PublicShell>
  );
}
