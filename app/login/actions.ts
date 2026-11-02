"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { translateAuthError } from "@/lib/auth-errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/safe-path";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const nextQs = next !== "/weiter" ? "&next=" + encodeURIComponent(next) : "";

  // 10 Versuche / 5 Minuten pro IP - schützt gegen automatisiertes
  // Passwort-Raten, ohne legitime Nutzer zu stören, die sich zwei-, dreimal
  // vertippen.
  const rateLimit = await checkRateLimit("login", { max: 10, windowSeconds: 300 });
  if (!rateLimit.allowed) {
    redirect("/login?error=" + encodeURIComponent("Zu viele Anmeldeversuche. Bitte warte ein paar Minuten.") + nextQs);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=" + encodeURIComponent(translateAuthError(error.message)) + nextQs);
  // Rollenabhängig weiter (Betrieb -> Dashboard, sonst Kundenkonto) oder
  // zurück zur ursprünglich aufgerufenen Seite.
  redirect(next);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login?message=" + encodeURIComponent("Du wurdest abgemeldet."));
}
