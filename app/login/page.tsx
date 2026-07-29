import Link from "next/link";
import { signIn } from "./actions";
import AuthShell from "@/components/auth/AuthShell";
import SubmitButton from "@/components/auth/SubmitButton";
import { ErrorMessage, SuccessMessage, Field } from "@/components/auth/FormMessage";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <AuthShell
      eyebrow="Willkommen zurück"
      title="Anmelden"
      subtitle="Melde dich an, um deine Treuekarten zu verwalten."
      footer={
        <>
          Noch kein Konto?{" "}
          <Link href="/register" className="text-gold hover:text-gold-bright">
            Jetzt registrieren
          </Link>
        </>
      }
    >
      <ErrorMessage>{searchParams?.error}</ErrorMessage>
      <SuccessMessage>{searchParams?.message}</SuccessMessage>

      <form action={signIn} className="space-y-1">
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
