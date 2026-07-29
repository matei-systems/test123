"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { translateAuthError } from "@/lib/auth-errors";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const passwordConfirm = String(formData.get("passwordConfirm"));

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

  if (data.session) {
    // E-Mail-Bestätigung ist im Supabase-Projekt deaktiviert - Session besteht sofort.
    redirect("/dashboard");
  }

  // Bestätigung erforderlich: noch keine Session, Link wurde per E-Mail verschickt.
  redirect("/register?success=" + encodeURIComponent(email));
}
