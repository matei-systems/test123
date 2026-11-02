import Link from "next/link";
import { signUp } from "./actions";
import AuthShell from "@/components/auth/AuthShell";
import SubmitButton from "@/components/auth/SubmitButton";
import { ErrorMessage, Field } from "@/components/auth/FormMessage";
import { safeNextPath } from "@/lib/safe-path";

export const dynamic = "force-dynamic";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string; email?: string; typ?: string; next?: string };
}) {
  if (searchParams?.success) {
    return (
      <AuthShell eyebrow="Fast geschafft" title="E-Mail bestätigen">
        <div className="text-[15px] text-fg leading-relaxed">
          Wir haben einen Bestätigungslink an <span className="font-semibold text-accent">{searchParams.success}</span> geschickt. Öffne die
          E-Mail und tippe auf den Link, um dein Konto zu aktivieren.
        </div>
        <div className="mt-6 pt-6 border-t border-line text-sm text-faint">
          Keine E-Mail erhalten? Prüfe deinen Spam-Ordner, oder{" "}
          <Link href="/register" className="text-gold hover:text-gold-bright">
            versuche es erneut
          </Link>
          .
        </div>
      </AuthShell>
    );
  }

  const business = searchParams?.typ === "geschaeft";
  const next = safeNextPath(searchParams?.next);
  const keep = (typ?: string) => {
    const p = new URLSearchParams();
    if (typ) p.set("typ", typ);
    if (next !== "/weiter") p.set("next", next);
    const s = p.toString();
    return s ? `/register?${s}` : "/register";
  };
  const loginHref = next !== "/weiter" ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <AuthShell
      eyebrow={business ? "Für Geschäfte" : "Für Kundinnen und Kunden"}
      title="Konto erstellen"
      subtitle={
        business
          ? "Lege danach deinen Betrieb an – 14 Tage kostenlos, ohne Zahlungsdaten."
          : "Kostenlos: alle Treuekarten an einem Ort, Verlauf und Belohnungen."
      }
      footer={
        <>
          Bereits ein Konto?{" "}
          <Link href={loginHref} className="text-gold hover:text-gold-bright">
            Anmelden
          </Link>
        </>
      }
    >
      <div role="tablist" aria-label="Kontotyp" className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-fg/[0.06] p-1">
        <Link
          href={keep()}
          role="tab"
          aria-selected={!business}
          className={`rounded-full px-3 py-2 text-center text-sm font-semibold transition ${!business ? "bg-surface text-fg shadow-soft" : "text-muted hover:text-fg"}`}
        >
          Ich bin Kunde
        </Link>
        <Link
          href={keep("geschaeft")}
          role="tab"
          aria-selected={business}
          className={`rounded-full px-3 py-2 text-center text-sm font-semibold transition ${business ? "bg-surface text-fg shadow-soft" : "text-muted hover:text-fg"}`}
        >
          Ich habe ein Geschäft
        </Link>
      </div>

      <ErrorMessage>{searchParams?.error}</ErrorMessage>

      <form action={signUp} className="space-y-1">
        <input type="hidden" name="accountType" value={business ? "geschaeft" : "kunde"} />
        <input type="hidden" name="next" value={next} />
        <Field label={business ? "Dein Name" : "Name"} type="text" name="fullName" autoComplete="name" placeholder="Vor- und Nachname" maxLength={120} />
        <Field
          label="E-Mail"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="du@beispiel.at"
          defaultValue={searchParams?.email}
        />
        <Field label="Passwort" type="password" name="password" required minLength={8} autoComplete="new-password" placeholder="mind. 8 Zeichen" />
        <Field
          label="Passwort bestätigen"
          type="password"
          name="passwordConfirm"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Passwort wiederholen"
        />
        <label className="flex items-start gap-2.5 mt-4 mb-5 text-sm text-dim cursor-pointer">
          <input type="checkbox" name="acceptTerms" required className="mt-0.5 w-5 h-5 rounded border-line accent-[rgb(var(--accent-strong))] shrink-0" />
          <span>
            Ich akzeptiere die{" "}
            <Link href="/agb" target="_blank" className="text-gold hover:text-gold-bright underline underline-offset-2">
              AGB
            </Link>{" "}
            und die{" "}
            <Link href="/datenschutz" target="_blank" className="text-gold hover:text-gold-bright underline underline-offset-2">
              Datenschutzerklärung
            </Link>
            .
          </span>
        </label>
        <SubmitButton pendingText="Konto wird erstellt…">{business ? "Weiter zum Betrieb" : "Kostenlos registrieren"}</SubmitButton>
      </form>
    </AuthShell>
  );
}
