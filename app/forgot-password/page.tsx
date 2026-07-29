import Link from "next/link";
import { requestPasswordReset } from "./actions";
import AuthShell from "@/components/auth/AuthShell";
import SubmitButton from "@/components/auth/SubmitButton";
import { ErrorMessage, Field } from "@/components/auth/FormMessage";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  if (searchParams?.success) {
    return (
      <AuthShell eyebrow="E-Mail unterwegs" title="Prüfe dein Postfach">
        <div className="text-sm text-[#F4F1EC] leading-relaxed">
          Falls ein Konto mit der Adresse{" "}
          <span className="text-gold-bright font-medium">{searchParams.success}</span> existiert, haben wir
          dir einen Link zum Zurücksetzen deines Passworts geschickt.
        </div>
        <div className="mt-6 pt-6 border-t border-line text-sm text-faint">
          <Link href="/login" className="text-gold hover:text-gold-bright">
            Zurück zur Anmeldung
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Zugang wiederherstellen"
      title="Passwort vergessen?"
      subtitle="Gib deine E-Mail-Adresse ein, wir schicken dir einen Link zum Zurücksetzen."
      footer={
        <Link href="/login" className="text-gold hover:text-gold-bright">
          Zurück zur Anmeldung
        </Link>
      }
    >
      <ErrorMessage>{searchParams?.error}</ErrorMessage>
      <form action={requestPasswordReset} className="space-y-1">
        <Field label="E-Mail" type="email" name="email" required autoComplete="email" placeholder="du@beispiel.at" />
        <div className="mb-5" />
        <SubmitButton pendingText="Wird gesendet…">Link anfordern</SubmitButton>
      </form>
    </AuthShell>
  );
}
