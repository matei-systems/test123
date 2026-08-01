"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateAuthError } from "@/lib/auth-errors";
import { LEGAL_VERSION } from "@/lib/legal/company-info";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const passwordConfirm = String(formData.get("passwordConfirm"));
  // Serverseitig prüfen, nicht nur das HTML "required" auf der Checkbox -
  // das lässt sich durch einen direkten POST an diese Action umgehen.
  const acceptedTerms = formData.get("acceptTerms") === "on";

  if (!acceptedTerms) {
    redirect(
      "/register?error=" +
        encodeURIComponent("Bitte akzeptiere die AGB und die Datenschutzerklärung.") +
        "&email=" +
        encodeURIComponent(email)
    );
  }

  if (password !== passwordConfirm) {
    redirect("/register?error=" + encodeURIComponent("Die Passwörter stimmen nicht überein.") + "&email=" + encodeURIComponent(email));
  }

  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${appUrl}/auth/callback?next=/dashboard` },
  });

  if (error) {
    redirect("/register?error=" + encodeURIComponent(translateAuthError(error.message)) + "&email=" + encodeURIComponent(email));
  }

  // Nachweis der Zustimmung (AGB + Datenschutzerklärung), unabhängig davon,
  // ob die E-Mail-Bestätigung aktiviert ist: die profiles-Zeile existiert
  // durch den handle_new_user()-Trigger bereits, aber ohne Session (bei
  // aktivierter Bestätigung) kann sie noch nicht über den authentifizierten
  // Client geschrieben werden - daher hier bewusst der Service-Role-Client.
  if (data.user) {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ terms_accepted_at: new Date().toISOString(), terms_version: LEGAL_VERSION })
      .eq("id", data.user.id);
  }

  if (data.session) {
    // E-Mail-Bestätigung ist im Supabase-Projekt deaktiviert - Session besteht sofort.
    redirect("/dashboard");
  }

  // Bestätigung erforderlich: noch keine Session, Link wurde per E-Mail verschickt.
  redirect("/register?success=" + encodeURIComponent(email));
}
