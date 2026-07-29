import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_LABEL, type Role } from "@/lib/permissions";
import { signOut } from "@/app/login/actions";
import AuthShell from "@/components/auth/AuthShell";
import { ErrorMessage, Field } from "@/components/auth/FormMessage";
import SubmitButton from "@/components/auth/SubmitButton";
import AcceptButton from "@/components/invite/AcceptButton";
import { signUpForInvite, signInForInvite } from "./actions";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string; confirmEmail?: string };
}) {
  const admin = createAdminClient();
  const { data: invitation } = await admin
    .from("invitations")
    .select("*, organizations(name)")
    .eq("token", params.token)
    .maybeSingle();

  if (!invitation) {
    return (
      <AuthShell eyebrow="Einladung" title="Nicht gefunden">
        <p className="text-sm text-[#A6A099]">Dieser Einladungslink ist ungültig.</p>
      </AuthShell>
    );
  }

  if (invitation.status === "revoked") {
    return (
      <AuthShell eyebrow="Einladung" title="Zurückgezogen">
        <p className="text-sm text-[#A6A099]">Diese Einladung wurde vom Betrieb zurückgezogen.</p>
      </AuthShell>
    );
  }

  if (invitation.status === "accepted") {
    return (
      <AuthShell eyebrow="Einladung" title="Bereits angenommen">
        <p className="text-sm text-[#A6A099] mb-4">Diese Einladung wurde bereits angenommen.</p>
        <Link href="/login" className="text-gold hover:text-gold-bright text-sm">
          Zum Login
        </Link>
      </AuthShell>
    );
  }

  const expired = new Date(invitation.expires_at) < new Date();
  if (expired || invitation.status === "expired") {
    return (
      <AuthShell eyebrow="Einladung" title="Abgelaufen">
        <p className="text-sm text-[#A6A099]">
          Diese Einladung ist abgelaufen. Bitte bitte die einladende Person um eine neue.
        </p>
      </AuthShell>
    );
  }

  if (searchParams?.confirmEmail) {
    return (
      <AuthShell eyebrow="Fast geschafft" title="E-Mail bestätigen">
        <p className="text-sm text-[#F4F1EC] leading-relaxed">
          Wir haben einen Bestätigungslink an{" "}
          <span className="text-gold-bright font-medium">{invitation.email}</span> geschickt. Öffne die E-Mail und
          bestätige dein Konto — danach landest du automatisch wieder hier, um die Einladung anzunehmen.
        </p>
      </AuthShell>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orgName = (invitation as any).organizations?.name ?? "einem Betrieb";
  const roleLabel = ROLE_LABEL[invitation.role as Role];

  if (!user) {
    return (
      <AuthShell eyebrow="Team-Einladung" title={`Zu ${orgName}`} subtitle={`Du wurdest als ${roleLabel} eingeladen.`}>
        <ErrorMessage>{searchParams?.error}</ErrorMessage>
        <div className="text-xs text-faint mb-5">
          Für: <span className="text-[#F4F1EC]">{invitation.email}</span>
        </div>

        <div className="text-[11px] font-bold tracking-[1.5px] uppercase text-faint mb-3">
          Neu hier? Konto erstellen
        </div>
        <form action={signUpForInvite.bind(null, params.token)} className="space-y-1 mb-8">
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
          <div className="mb-3" />
          <SubmitButton pendingText="Konto wird erstellt…">Konto erstellen &amp; annehmen</SubmitButton>
        </form>

        <div className="text-[11px] font-bold tracking-[1.5px] uppercase text-faint mb-3 pt-6 border-t border-line">
          Schon ein Konto? Anmelden
        </div>
        <form action={signInForInvite.bind(null, params.token)} className="space-y-1">
          <Field label="Passwort" type="password" name="password" required autoComplete="current-password" placeholder="••••••••" />
          <div className="mb-3" />
          <SubmitButton pendingText="Wird angemeldet…" variant="line">
            Anmelden &amp; annehmen
          </SubmitButton>
        </form>
      </AuthShell>
    );
  }

  if ((user.email ?? "").toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <AuthShell eyebrow="Team-Einladung" title="Falsches Konto">
        <p className="text-sm text-[#F4F1EC] leading-relaxed mb-6">
          Diese Einladung ist für <span className="text-gold-bright">{invitation.email}</span> bestimmt. Du bist
          aktuell als <span className="text-gold-bright">{user.email}</span> angemeldet.
        </p>
        <form action={signOut}>
          <SubmitButton pendingText="Wird abgemeldet…" variant="line">
            Abmelden
          </SubmitButton>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Team-Einladung" title={`Zu ${orgName}`} subtitle={`Als ${roleLabel} beitreten?`}>
      <ErrorMessage>{searchParams?.error}</ErrorMessage>
      <AcceptButton token={params.token} />
    </AuthShell>
  );
}
