"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateAuthError } from "@/lib/auth-errors";
import { LEGAL_VERSION } from "@/lib/legal/company-info";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/safe-path";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim().slice(0, 120);
  // Kontotyp steuert nur, wohin es nach der Registrierung geht (Kundenkonto
  // oder Betriebs-Onboarding). Berechtigungen entstehen ausschließlich über
  // Mitgliedschaften in der Datenbank, nie über diese Angabe.
  const accountType = formData.get("accountType") === "geschaeft" ? "geschaeft" : "kunde";
  const next = safeNextPath(String(formData.get("next") ?? ""));
  // Serverseitig prüfen, nicht nur das HTML "required" auf der Checkbox -
  // das lässt sich durch einen direkten POST an diese Action umgehen.
  const acceptedTerms = formData.get("acceptTerms") === "on";

  const back = (msg: string) =>
    redirect(
      "/register?error=" +
        encodeURIComponent(msg) +
        "&email=" +
        encodeURIComponent(email) +
        (accountType === "geschaeft" ? "&typ=geschaeft" : "") +
        (next !== "/weiter" ? "&next=" + encodeURIComponent(next) : "")
    );

  // 5 Registrierungen / Stunde pro IP - schützt gegen automatisierten
  // Massen-Account-Spam.
  const rateLimit = await checkRateLimit("register", { max: 5, windowSeconds: 3600 });
  if (!rateLimit.allowed) back("Zu viele Registrierungen von dieser Verbindung. Bitte versuche es später erneut.");

  if (!acceptedTerms) back("Bitte akzeptiere die AGB und die Datenschutzerklärung.");
  if (password.length < 8) back("Bitte wähle ein Passwort mit mindestens 8 Zeichen.");
  if (password !== passwordConfirm) back("Die Passwörter stimmen nicht überein.");

  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { account_type: accountType, full_name: fullName || undefined },
      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) back(translateAuthError(error.message));

  // Nachweis der Zustimmung (AGB + Datenschutzerklärung) und Name, unabhängig
  // davon, ob die E-Mail-Bestätigung aktiviert ist: die profiles-Zeile
  // existiert durch den handle_new_user()-Trigger bereits, aber ohne Session
  // (bei aktivierter Bestätigung) kann sie noch nicht über den
  // authentifizierten Client geschrieben werden - daher der Service-Role-Client.
  if (data.user) {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        terms_accepted_at: new Date().toISOString(),
        terms_version: LEGAL_VERSION,
        ...(fullName ? { full_name: fullName } : {}),
      })
      .eq("id", data.user.id);
  }

  if (data.session) {
    // E-Mail-Bestätigung ist deaktiviert - Session besteht sofort.
    redirect(next);
  }

  // Bestätigung erforderlich: noch keine Session, Link wurde per E-Mail verschickt.
  redirect("/register?success=" + encodeURIComponent(email));
}
