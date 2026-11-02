import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveDesign, cardBaseStyle, cardTextColor } from "@/lib/card-design";
import { earningRuleText, costText } from "@/lib/programs";
import JoinForm from "@/components/join/JoinForm";
import Logo from "@/components/ui/Logo";
import SubmitButton from "@/components/SubmitButton";
import { joinProgramAsUser } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Treuekarte holen", robots: { index: false } };

export default async function JoinProgramPage({ params, searchParams }: { params: { programId: string }; searchParams: { fehler?: string } }) {
  const admin = createAdminClient();
  const { data: program } = await admin
    .from("loyalty_programs")
    .select(
      "id, title, name, type, stamps_required, points_per_reward, reward_description, design, active, earning_mode, min_purchase_amount, amount_per_point, organizations(name)"
    )
    .eq("id", params.programId)
    .maybeSingle();

  if (!program || !program.active) notFound();

  const p = program as any;
  const design = resolveDesign(p.design);
  const orgName = p.organizations?.name ?? "Dieses Geschäft";
  const title = p.title ?? p.name ?? "Treuekarte";
  const goal = p.type === "stamp" ? costText("stamp", p.stamps_required) : costText("points", p.points_per_reward);

  const {
    data: { user },
  } = await createClient().auth.getUser();
  const next = encodeURIComponent(`/j/${p.id}`);

  return (
    <main id="inhalt" className="relative min-h-screen overflow-hidden bg-paper px-4 py-10 text-fg sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgb(var(--accent-strong) / 0.12), transparent 70%)" }}
      />
      <div className="relative mx-auto w-full max-w-[420px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-4 p-6" style={{ ...cardBaseStyle(design), color: cardTextColor(design) }}>
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/15 text-lg font-extrabold">
              {design.logoImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={design.logoImage} alt="" className="h-full w-full object-cover" />
              ) : (
                design.logo
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">{orgName}</p>
              <h1 className="font-display text-2xl font-semibold leading-tight">{title}</h1>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-px bg-line text-sm">
            <div className="bg-surface p-4">
              <dt className="text-muted">So sammelst du</dt>
              <dd className="mt-1 font-semibold">{earningRuleText(p)}</dd>
            </div>
            <div className="bg-surface p-4">
              <dt className="text-muted">Belohnung</dt>
              <dd className="mt-1 font-semibold">
                {goal}
                {p.reward_description ? ` → ${p.reward_description}` : ""}
              </dd>
            </div>
          </dl>
        </div>

        {searchParams.fehler && (
          <p role="alert" className="mt-5 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {searchParams.fehler}
          </p>
        )}

        {user ? (
          <form action={joinProgramAsUser.bind(null, p.id)} className="card mt-5 p-6">
            <h2 className="font-display text-xl font-semibold">Karte in dein Wallet</h2>
            <p className="mt-1 text-sm text-muted">
              Angemeldet als <strong className="text-fg">{user.email}</strong>. Die Karte erscheint sofort in deinem Konto.
            </p>
            <SubmitButton className="btn btn-primary btn-lg mt-5 w-full" pendingText="Karte wird angelegt …">
              Karte zu meinem Konto hinzufügen
            </SubmitButton>
          </form>
        ) : (
          <>
            <div className="card mt-5 p-6">
              <h2 className="font-display text-xl font-semibold">Mit Konto (empfohlen)</h2>
              <p className="mt-1 text-sm text-muted">Alle Karten an einem Ort, Verlauf und Einlöse-Codes – kostenlos.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href={`/register?next=${next}`} className="btn btn-primary">
                  Konto erstellen
                </Link>
                <Link href={`/login?next=${next}`} className="btn btn-ghost">
                  Anmelden
                </Link>
              </div>
            </div>
            <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-faint">
              <span className="h-px flex-1 bg-line" /> oder ohne Konto <span className="h-px flex-1 bg-line" />
            </div>
            <JoinForm programId={p.id} />
          </>
        )}

        <p className="mt-6 text-center text-xs leading-relaxed text-faint">
          Keine App nötig · Stempel und Punkte gelten nur bei {orgName} ·{" "}
          <Link href="/datenschutz" className="underline underline-offset-2">Datenschutz</Link>
        </p>
      </div>
    </main>
  );
}
