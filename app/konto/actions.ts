"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { claimCard, createRedemptionRequest, serialFromInput } from "@/lib/ledger";
import { translateAuthError } from "@/lib/auth-errors";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/konto");
  return { supabase, user: user! };
}

// Einlöse-Code für eine Belohnung erzeugen. Die Datenbank prüft Besitz der
// Karte, Gültigkeit der Belohnung und Guthaben; ein neuer Code storniert
// einen eventuell noch offenen alten Code derselben Karte.
export async function requestRedemptionCode(cardId: string, rewardId: string) {
  const { supabase, user } = await requireUser();
  const rl = await checkRateLimit("redeem-code", { max: 20, windowSeconds: 600, identifier: user.id });
  if (!rl.allowed) redirect(`/konto/karten/${cardId}?fehler=${encodeURIComponent("Zu viele Codes in kurzer Zeit. Bitte warte ein paar Minuten.")}`);

  const res = await createRedemptionRequest(supabase, cardId, rewardId);
  if (!res.ok) redirect(`/konto/karten/${cardId}?fehler=${encodeURIComponent(res.error)}`);

  const { data: request } = await supabase
    .from("redemption_requests")
    .select("id")
    .eq("token", (res as any).data.token)
    .maybeSingle();
  if (!request) redirect(`/konto/karten/${cardId}?fehler=${encodeURIComponent("Der Code konnte nicht geladen werden. Bitte erneut versuchen.")}`);
  redirect(`/konto/einloesen/${request!.id}`);
}

export async function getRedemptionStatus(requestId: string): Promise<{ status: string; expiresAt: string | null }> {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("redemption_requests").select("status, expires_at").eq("id", requestId).maybeSingle();
  if (!data) return { status: "missing", expiresAt: null };
  const expired = data.status === "pending" && new Date(data.expires_at).getTime() < Date.now();
  return { status: expired ? "expired" : data.status, expiresAt: data.expires_at };
}

export async function claimCardAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const serial = serialFromInput(String(formData.get("card") ?? ""));
  if (!serial) redirect("/konto/verknuepfen?fehler=" + encodeURIComponent("Bitte füge den Link deiner Karte oder die Kartennummer ein."));
  const rl = await checkRateLimit("claim", { max: 20, windowSeconds: 3600, identifier: user.id });
  if (!rl.allowed) redirect("/konto/verknuepfen?fehler=" + encodeURIComponent("Zu viele Versuche. Bitte später erneut versuchen."));
  const res = await claimCard(supabase, serial!);
  if (!res.ok) redirect("/konto/verknuepfen?fehler=" + encodeURIComponent(res.error));
  revalidatePath("/konto");
  redirect(`/konto/karten/${(res as any).data.card_id}?verknuepft=1`);
}

export async function claimCardBySerial(serial: string) {
  const { supabase } = await requireUser();
  const res = await claimCard(supabase, serial);
  if (!res.ok) redirect(`/c/${encodeURIComponent(serial)}?fehler=${encodeURIComponent(res.error)}`);
  revalidatePath("/konto");
  redirect(`/konto/karten/${(res as any).data.card_id}?verknuepft=1`);
}

export async function updateName(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("fullName") ?? "").trim().slice(0, 120);
  if (name.length < 2) redirect("/konto/profil?fehler=" + encodeURIComponent("Bitte gib deinen Namen an (mindestens 2 Zeichen)."));
  const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);
  if (error) redirect("/konto/profil?fehler=" + encodeURIComponent("Der Name konnte nicht gespeichert werden."));
  revalidatePath("/konto/profil");
  redirect("/konto/profil?ok=" + encodeURIComponent("Name gespeichert."));
}

export async function changeEmail(formData: FormData) {
  const { supabase, user } = await requireUser();
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) redirect("/konto/profil?fehler=" + encodeURIComponent("Bitte gib eine gültige E-Mail-Adresse an."));
  if (email.toLowerCase() === (user.email ?? "").toLowerCase()) redirect("/konto/profil?fehler=" + encodeURIComponent("Das ist bereits deine E-Mail-Adresse."));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: `${appUrl}/auth/callback?next=/konto/profil` });
  if (error) redirect("/konto/profil?fehler=" + encodeURIComponent(translateAuthError(error.message)));
  redirect(
    "/konto/profil?ok=" +
      encodeURIComponent("Fast fertig: Falls eine Bestätigung nötig ist, haben wir dir einen Link an die neue Adresse geschickt.")
  );
}

export async function changePassword(formData: FormData) {
  const { supabase, user } = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("passwordConfirm") ?? "");
  if (next.length < 8) redirect("/konto/profil?fehler=" + encodeURIComponent("Das neue Passwort braucht mindestens 8 Zeichen."));
  if (next !== confirm) redirect("/konto/profil?fehler=" + encodeURIComponent("Die neuen Passwörter stimmen nicht überein."));

  const rl = await checkRateLimit("password-change", { max: 5, windowSeconds: 900, identifier: user.id });
  if (!rl.allowed) redirect("/konto/profil?fehler=" + encodeURIComponent("Zu viele Versuche. Bitte warte ein paar Minuten."));

  // Aktuelles Passwort bestätigen, damit eine offen gelassene Sitzung nicht
  // reicht, um das Konto zu übernehmen.
  const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email!, password: current });
  if (authErr) redirect("/konto/profil?fehler=" + encodeURIComponent("Das aktuelle Passwort ist nicht korrekt."));

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) redirect("/konto/profil?fehler=" + encodeURIComponent(translateAuthError(error.message)));
  redirect("/konto/profil?ok=" + encodeURIComponent("Passwort geändert."));
}

// Konto löschen (DSGVO Art. 17). Das Auth-Konto wird gelöscht; durch die
// Fremdschlüssel werden Profil, Einlöse-Codes und Teammitgliedschaften
// mitgelöscht und die Verknüpfung customers.user_id auf NULL gesetzt. Die
// Kundendatensätze und Buchungen gehören zu den Aufzeichnungen der
// jeweiligen Geschäfte und bleiben dort (siehe Datenschutzerklärung).
// Inhaber eines Betriebs können sich nicht selbst löschen - der Betrieb
// hätte sonst keinen Inhaber mehr.
export async function deleteAccount(formData: FormData) {
  const { supabase, user } = await requireUser();
  const password = String(formData.get("password") ?? "");
  const confirmWord = String(formData.get("confirm") ?? "").trim().toUpperCase();
  if (confirmWord !== "LÖSCHEN") redirect("/konto/profil?fehler=" + encodeURIComponent("Bitte tippe zur Bestätigung LÖSCHEN ein."));

  const rl = await checkRateLimit("account-delete", { max: 5, windowSeconds: 900, identifier: user.id });
  if (!rl.allowed) redirect("/konto/profil?fehler=" + encodeURIComponent("Zu viele Versuche. Bitte warte ein paar Minuten."));

  const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email!, password });
  if (authErr) redirect("/konto/profil?fehler=" + encodeURIComponent("Das Passwort ist nicht korrekt."));

  const admin = createAdminClient();
  const { data: owned } = await admin.from("memberships").select("org_id").eq("user_id", user.id).eq("role", "owner");
  if ((owned ?? []).length > 0) {
    redirect(
      "/konto/profil?fehler=" +
        encodeURIComponent("Du bist Inhaber eines Betriebs. Bitte wende dich an den Support, damit der Betrieb übergeben oder geschlossen wird.")
    );
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) redirect("/konto/profil?fehler=" + encodeURIComponent("Das Konto konnte nicht gelöscht werden. Bitte kontaktiere den Support."));

  await supabase.auth.signOut();
  redirect("/?konto=geloescht");
}
