"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateAuthError } from "@/lib/auth-errors";
import { translateDbError } from "@/lib/db-errors";

async function loadInvitation(token: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("invitations").select("*").eq("token", token).maybeSingle();
  return data;
}

// Registrierung im Rahmen einer Einladung: die E-Mail kommt server-seitig aus
// der Einladung selbst (nicht aus dem Formular) - so kann niemand ein Konto
// mit einer anderen Adresse anlegen und die Einladung trotzdem annehmen.
export async function signUpForInvite(token: string, formData: FormData) {
  const invitation = await loadInvitation(token);
  if (!invitation || invitation.status !== "pending") redirect(`/invite/${token}`);

  const password = String(formData.get("password"));
  const passwordConfirm = String(formData.get("passwordConfirm"));
  if (password !== passwordConfirm) {
    redirect(`/invite/${token}?error=` + encodeURIComponent("Die Passwörter stimmen nicht überein."));
  }

  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { data, error } = await supabase.auth.signUp({
    email: invitation.email,
    password,
    options: { emailRedirectTo: `${appUrl}/auth/callback?next=/invite/${token}` },
  });

  if (error) redirect(`/invite/${token}?error=` + encodeURIComponent(translateAuthError(error.message)));

  if (data.session) redirect(`/invite/${token}`);
  redirect(`/invite/${token}?confirmEmail=1`);
}

export async function signInForInvite(token: string, formData: FormData) {
  const invitation = await loadInvitation(token);
  if (!invitation) redirect(`/invite/${token}`);

  const password = String(formData.get("password"));
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: invitation.email, password });
  if (error) redirect(`/invite/${token}?error=` + encodeURIComponent(translateAuthError(error.message)));
  redirect(`/invite/${token}`);
}

// Aufgerufen aus einer Client-Komponente (useTransition) statt über <form> -
// deshalb Rückgabewert statt redirect(), der Client navigiert bei Erfolg per
// window.location.href (siehe Kommentar in DeleteProgramButton für den Grund).
export async function acceptInvitation(token: string): Promise<{ error?: string; ok?: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich zuerst an." };

  const admin = createAdminClient();
  const { data: invitation } = await admin.from("invitations").select("*").eq("token", token).maybeSingle();
  if (!invitation || invitation.status !== "pending") return { error: "Diese Einladung ist nicht mehr gültig." };
  if (new Date(invitation.expires_at) < new Date()) {
    await admin.from("invitations").update({ status: "expired" }).eq("id", invitation.id);
    return { error: "Diese Einladung ist abgelaufen." };
  }
  if ((user.email ?? "").toLowerCase() !== invitation.email.toLowerCase()) {
    return { error: `Diese Einladung ist für ${invitation.email} bestimmt.` };
  }

  const { data: existingMembership } = await admin
    .from("memberships")
    .select("id, org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMembership && existingMembership.org_id !== invitation.org_id) {
    return {
      error:
        "Dein Konto gehört bereits zu einem anderen Betrieb. Mehrere Betriebe pro Konto werden aktuell nicht unterstützt.",
    };
  }

  if (!existingMembership) {
    const { error: memErr } = await admin.from("memberships").insert({
      org_id: invitation.org_id,
      user_id: user.id,
      role: invitation.role,
    });
    if (memErr) return { error: translateDbError(memErr.message) };
  }

  await admin.from("invitations").update({ status: "accepted" }).eq("id", invitation.id);
  return { ok: true };
}
