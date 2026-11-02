import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicShell, { Container } from "@/components/site/PublicShell";
import SubmitButton from "@/components/SubmitButton";
import { getPublicBusiness } from "@/lib/directory";
import { reportBusiness } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profil melden", robots: { index: false } };

export default async function MeldenPage({ params, searchParams }: { params: { slug: string }; searchParams: { gesendet?: string; fehler?: string } }) {
  const data = await getPublicBusiness(params.slug);
  if (!data) notFound();
  const b = data.business;
  const action = reportBusiness.bind(null, params.slug);

  return (
    <PublicShell>
      <Container className="max-w-2xl py-12 md:py-16">
        <Link href={`/geschaefte/${b.slug}`} className="text-sm text-muted hover:text-accent">
          ← Zurück zu {b.display_name}
        </Link>
        <h1 className="mt-4 font-display text-[36px] font-semibold leading-tight">Profil melden</h1>
        <p className="mt-2 text-muted">
          Falsche Angaben, unangemessene Inhalte oder Verdacht auf Betrug bei <strong className="text-fg">{b.display_name}</strong>? Wir prüfen
          jede Meldung.
        </p>
        <div className="card mt-8 p-6 md:p-8">
          {searchParams.gesendet === "1" ? (
            <div role="status">
              <h2 className="font-display text-2xl font-semibold">Danke für deine Meldung.</h2>
              <p className="mt-2 text-muted">Wir sehen sie uns an und handeln, falls nötig. Eine Rückmeldung erhältst du, wenn du eine E-Mail angegeben hast.</p>
            </div>
          ) : (
            <form action={action} className="space-y-5">
              {searchParams.fehler && (
                <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                  {searchParams.fehler}
                </p>
              )}
              <fieldset>
                <legend className="label">Grund</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ["falsche_angaben", "Falsche Angaben"],
                    ["unangemessen", "Unangemessene Inhalte"],
                    ["betrug", "Verdacht auf Betrug"],
                    ["sonstiges", "Sonstiges"],
                  ].map(([v, l], i) => (
                    <label key={v} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-line px-4 has-[:checked]:border-accent-strong has-[:checked]:bg-accent-strong/5">
                      <input type="radio" name="reason" value={v} defaultChecked={i === 0} className="accent-[rgb(var(--accent-strong))]" />
                      {l}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label htmlFor="message" className="label">Was stimmt nicht?</label>
                <textarea id="message" name="message" className="input" required minLength={10} maxLength={2000} />
              </div>
              <div>
                <label htmlFor="email" className="label">E-Mail für Rückfragen (optional)</label>
                <input id="email" name="email" type="email" className="input" autoComplete="email" />
              </div>
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <input name="website" tabIndex={-1} autoComplete="off" />
              </div>
              <SubmitButton pendingText="Wird gesendet …">Meldung senden</SubmitButton>
            </form>
          )}
        </div>
      </Container>
    </PublicShell>
  );
}
