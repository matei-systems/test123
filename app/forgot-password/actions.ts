"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { translateAuthError } from "@/lib/auth-errors";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email"));
  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  });

  // Supabase does not reveal whether the address exists (avoids account
  // enumeration), so a real rate-limit/network error is the only case we
  // surface as an error - anything else always shows the same success state.
  if (error && !error.message.toLowerCase().includes("user not found")) {
    redirect("/forgot-password?error=" + encodeURIComponent(translateAuthError(error.message)));
  }

  redirect("/forgot-password?success=" + encodeURIComponent(email));
}
