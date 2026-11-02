import Link from "next/link";
import { signIn } from "./actions";
import AuthShell from "@/components/auth/AuthShell";
import SubmitButton from "@/components/auth/SubmitButton";
import { ErrorMessage, SuccessMessage, Field } from "@/components/auth/FormMessage";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-path";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string; next?: string };
}) {
  const next = safeNextPath(searchParams?.next);
  // Bereits angemeldet -> direkt weiter, statt das Formular erneut zu zeigen.
  const {
    data: { user },
  } = await createClient().auth.getUser();
  if (user && !searchParams?.error) redirect(next);
  const registerHref = next !== "/weiter" ? `/register?next=${encodeURIComponent(next)}` : "/register";

  return (
    <AuthShell
      eyebrow="Willkommen zurück"
      title="Anmelden"
      subtitle="Für Kundinnen, Kunden und Geschäfte – ein Login für alles."
      footer={
        <>
          Noch kein Konto?{" "}
          <Link href={registerHref} className="text-gold hover:text-gold-bright">
            Jetzt registrieren
          </Link>
        </>
      }
    >
      <ErrorMessage>{searchParams?.error}</ErrorMessage>
      <SuccessMessage>{searchParams?.message}</SuccessMessage>

      <form action={signIn} className="space-y-1">
        <input type="hidden" name="next" value={next} />
        <Field label="E-Mail" type="email" name="email" required autoComplete="email" placeholder="du@beispiel.at" />
        <Field
          label="Passwort"
          type="password"
          name="password"
          required
          minLength={6}
          autoComplete="current-password"
          placeholder="••••••••"
        />
        <div className="flex justify-end mb-5">
          <Link href="/forgot-password" className="text-xs text-faint hover:text-gold-bright">
            Passwort vergessen?
          </Link>
        </div>
        <SubmitButton pendingText="Wird angemeldet…">Anmelden</SubmitButton>
      </form>
    </AuthShell>
  );
}
