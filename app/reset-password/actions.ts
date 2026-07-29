"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { translateAuthError } from "@/lib/auth-errors";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password"));
  const passwordConfirm = String(formData.get("passwordConfirm"));

  if (password !== passwordConfirm) {
    redirect("/reset-password?error=" + encodeURIComponent("Die Passwörter stimmen nicht überein."));
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/forgot-password?error=" + encodeURIComponent("Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen an."));
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect("/reset-password?error=" + encodeURIComponent(translateAuthError(error.message)));
  }

  await supabase.auth.signOut();
  redirect("/login?message=" + encodeURIComponent("Passwort erfolgreich geändert. Bitte melde dich mit deinem neuen Passwort an."));
}
