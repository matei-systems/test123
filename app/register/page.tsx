import Link from "next/link";
import { signUp } from "./actions";
import AuthShell from "@/components/auth/AuthShell";
import SubmitButton from "@/components/auth/SubmitButton";
import { ErrorMessage, Field } from "@/components/auth/FormMessage";

export const dynamic = "force-dynamic";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string; email?: string };
}) {
  if (searchParams?.success) {
    return (
      <AuthShell eyebrow="Fast geschafft" title="E-Mail bestätigen">
        <div className="text-sm text-[#F4F1EC] leading-relaxed">
          Wir haben einen Bestätigungslink an{" "}
          <span className="text-gold-bright font-medium">{searchParams.success}</span> geschickt. Öffne die
          E-Mail und klicke auf den Link, um dein Konto zu aktivieren.
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

  return (
    <AuthShell
      eyebrow="Neu bei Matei Loyalty"
      title="Konto erstellen"
      subtitle="Leg deinen Betrieb an und starte mit digitalen Treuekarten."
      footer={
        <>
          Bereits ein Konto?{" "}
          <Link href="/login" className="text-gold hover:text-gold-bright">
            Anmelden
          </Link>
        </>
      }
    >
      <ErrorMessage>{searchParams?.error}</ErrorMessage>

      <form action={signUp} className="space-y-1">
        <Field
          label="E-Mail"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="du@beispiel.at"
          defaultValue={searchParams?.email}
        />
        <Field
          label="Passwort"
          type="password"
          name="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="mind. 6 Zeichen"
        />
        <Field
          label="Passwort bestätigen"
          type="password"
          name="passwordConfirm"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="mind. 6 Zeichen"
        />
        <div className="mb-5" />
        <SubmitButton pendingText="Konto wird erstellt…">Konto erstellen</SubmitButton>
      </form>
    </AuthShell>
  );
}
