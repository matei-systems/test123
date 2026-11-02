import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/SubmitButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { signOut } from "@/app/login/actions";
import { changeEmail, changePassword, deleteAccount, updateName } from "@/app/konto/actions";

export const metadata = { title: "Profil" };

function Section({ id, title, desc, children }: { id: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="card p-6">
      <h2 id={id} className="font-display text-xl font-semibold">
        {title}
      </h2>
      {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function ProfilPage({ searchParams }: { searchParams: { ok?: string; fehler?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name, email, created_at").eq("id", user!.id).maybeSingle();

  return (
    <div className="enter mx-auto max-w-2xl">
      <p className="eyebrow">Einstellungen</p>
      <h1 className="mt-2 font-display text-[36px] font-semibold leading-tight sm:text-[44px]">Profil</h1>

      {searchParams.ok && (
        <p role="status" className="mt-5 rounded-xl bg-forest/10 px-4 py-3 text-sm font-semibold text-forest">
          {searchParams.ok}
        </p>
      )}
      {searchParams.fehler && (
        <p role="alert" className="mt-5 rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          {searchParams.fehler}
        </p>
      )}

      <div className="mt-6 space-y-5">
        <Section id="name-h" title="Name" desc="So sprechen wir dich an. Geschäfte sehen den Namen, den du beim Holen einer Karte angegeben hast.">
          <form action={updateName} className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="fullName" className="sr-only">Name</label>
            <input id="fullName" name="fullName" className="input" defaultValue={profile?.full_name ?? ""} autoComplete="name" required minLength={2} maxLength={120} />
            <SubmitButton className="btn btn-dark shrink-0" pendingText="Speichern …">Speichern</SubmitButton>
          </form>
        </Section>

        <Section id="mail-h" title="E-Mail-Adresse" desc={`Aktuell: ${user!.email}`}>
          <form action={changeEmail} className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="email" className="sr-only">Neue E-Mail-Adresse</label>
            <input id="email" name="email" type="email" className="input" placeholder="neue@adresse.at" autoComplete="email" required />
            <SubmitButton className="btn btn-dark shrink-0" pendingText="Ändern …">Ändern</SubmitButton>
          </form>
        </Section>

        <Section id="pw-h" title="Passwort ändern">
          <form action={changePassword} className="grid gap-3">
            <div>
              <label htmlFor="current" className="label">Aktuelles Passwort</label>
              <input id="current" name="current" type="password" className="input" autoComplete="current-password" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="label">Neues Passwort</label>
                <input id="password" name="password" type="password" className="input" autoComplete="new-password" minLength={8} required />
              </div>
              <div>
                <label htmlFor="passwordConfirm" className="label">Wiederholen</label>
                <input id="passwordConfirm" name="passwordConfirm" type="password" className="input" autoComplete="new-password" minLength={8} required />
              </div>
            </div>
            <SubmitButton className="btn btn-dark w-fit" pendingText="Wird geändert …">Passwort ändern</SubmitButton>
          </form>
        </Section>

        <Section id="look-h" title="Darstellung" desc="Hell oder dunkel – wird auf diesem Gerät gespeichert.">
          <div className="flex items-center gap-3 text-[15px]">
            <ThemeToggle /> Farbschema umschalten
          </div>
        </Section>

        <Section id="data-h" title="Deine Daten" desc="Lade alle Daten herunter, die deinem Konto zugeordnet sind: Profil, Karten, Buchungen und Einlöse-Codes.">
          <div className="flex flex-wrap gap-3">
            <a href="/konto/export" className="btn btn-ghost">
              Daten herunterladen (JSON)
            </a>
            <Link href="/datenschutz" className="btn btn-soft">
              Datenschutzerklärung
            </Link>
          </div>
        </Section>

        <Section id="out-h" title="Abmelden">
          <form action={signOut}>
            <button type="submit" className="btn btn-ghost">
              Auf diesem Gerät abmelden
            </button>
          </form>
        </Section>

        <section aria-labelledby="del-h" className="card border-danger/30 p-6">
          <h2 id="del-h" className="font-display text-xl font-semibold text-danger">Konto löschen</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Dein Konto, dein Profil und offene Einlöse-Codes werden endgültig gelöscht und deine Karten vom Konto getrennt. Die
            Buchungen bleiben bei den jeweiligen Geschäften als deren Aufzeichnungen bestehen. Das lässt sich nicht rückgängig machen.
          </p>
          <details className="mt-4">
            <summary className="btn btn-danger w-fit cursor-pointer list-none">Konto löschen …</summary>
            <form action={deleteAccount} className="mt-4 grid gap-3">
              <div>
                <label htmlFor="del-password" className="label">Passwort zur Bestätigung</label>
                <input id="del-password" name="password" type="password" className="input" autoComplete="current-password" required />
              </div>
              <div>
                <label htmlFor="del-confirm" className="label">Tippe LÖSCHEN ein</label>
                <input id="del-confirm" name="confirm" className="input" autoComplete="off" required pattern="[Ll][Öö][Ss][Cc][Hh][Ee][Nn]" />
              </div>
              <SubmitButton className="btn btn-danger w-fit" pendingText="Wird gelöscht …">Endgültig löschen</SubmitButton>
            </form>
          </details>
        </section>
      </div>
    </div>
  );
}
