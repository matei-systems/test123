"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getPublicBusiness } from "@/lib/directory";

const REASONS = ["falsche_angaben", "unangemessen", "betrug", "sonstiges"] as const;

// Meldung eines öffentlichen Geschäftsprofils. Nur für sichtbare Profile
// (die org_id kommt aus dem serverseitig geladenen Profil, nie vom Client).
export async function reportBusiness(slug: string, formData: FormData) {
  const base = `/geschaefte/${encodeURIComponent(slug)}/melden`;
  const back = (msg: string) => redirect(`${base}?fehler=` + encodeURIComponent(msg));

  if (String(formData.get("website") ?? "")) redirect(`${base}?gesendet=1`);

  const data = await getPublicBusiness(slug);
  if (!data) back("Dieses Profil ist nicht mehr öffentlich sichtbar.");

  const reason = String(formData.get("reason") ?? "");
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  if (!(REASONS as readonly string[]).includes(reason)) back("Bitte wähle einen Grund.");
  if (message.length < 10) back("Bitte beschreibe kurz, was nicht stimmt (mindestens 10 Zeichen).");

  const rl = await checkRateLimit("report", { max: 5, windowSeconds: 3600 });
  if (!rl.allowed) back("Zu viele Meldungen von dieser Verbindung. Bitte versuche es später erneut.");

  const {
    data: { user },
  } = await createClient().auth.getUser();

  const { error } = await createAdminClient()
    .from("content_reports")
    .insert({ org_id: data!.business.org_id, reason, message, reporter_email: email || user?.email || null, reporter_user_id: user?.id ?? null });
  if (error) back("Die Meldung konnte gerade nicht gespeichert werden. Bitte nutze das Kontaktformular.");

  redirect(`${base}?gesendet=1`);
}
