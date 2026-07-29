import Link from "next/link";
import { updatePassword } from "./actions";
import { createClient } from "@/lib/supabase/server";
import AuthShell from "@/components/auth/AuthShell";
import SubmitButton from "@/components/auth/SubmitButton";
import { ErrorMessage, Field } from "@/components/auth/FormMessage";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthShell eyebrow="Link ungültig" title="Link abgelaufen">
        <div className="text-sm text-[#F4F1EC] leading-relaxed">
          Dieser Link zum Zurücksetzen des Passworts ist ungültig oder wurde bereits verwendet.
        </div>
        <div className="mt-6">
          <Link
            href="/forgot-password"
            className="inline-flex w-full items-center justify-center px-5 py-3 rounded-xl text-[15px] font-semibold bg-gold-grad text-[#241a0c]"
          >
            Neuen Link anfordern
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Neues Passwort" title="Passwort zurücksetzen" subtitle="Wähle ein neues Passwort für dein Konto.">
      <ErrorMessage>{searchParams?.error}</ErrorMessage>
      <form action={updatePassword} className="space-y-1">
        <Field
          label="Neues Passwort"
          type="password"
          name="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="mind. 6 Zeichen"
        />
        <Field
          label="Neues Passwort bestätigen"
          type="password"
          name="passwordConfirm"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="mind. 6 Zeichen"
        />
        <div className="mb-5" />
        <SubmitButton pendingText="Wird gespeichert…">Passwort speichern</SubmitButton>
      </form>
    </AuthShell>
  );
}
