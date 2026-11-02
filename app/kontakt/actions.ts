"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

const TOPICS = ["kunde", "geschaeft", "presse", "sonstiges"] as const;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Kontaktanfrage: serverseitig validiert, Honeypot + Rate-Limit gegen Spam,
// gespeichert in contact_messages (nur service_role, Lesen im Admin-Panel).
export async function sendContactMessage(formData: FormData) {
  const back = (msg: string) => redirect("/kontakt?fehler=" + encodeURIComponent(msg));

  if (String(formData.get("website") ?? "")) redirect("/kontakt?gesendet=1"); // Honeypot

  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const topic = String(formData.get("topic") ?? "sonstiges");
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2) back("Bitte gib deinen Namen an.");
  if (!EMAIL_RX.test(email)) back("Bitte gib eine gültige E-Mail-Adresse an, damit wir antworten können.");
  if (!(TOPICS as readonly string[]).includes(topic)) back("Bitte wähle ein Thema.");
  if (message.length < 10) back("Deine Nachricht ist zu kurz (mindestens 10 Zeichen).");
  if (message.length > 4000) back("Deine Nachricht ist zu lang (höchstens 4000 Zeichen).");

  const rl = await checkRateLimit("contact", { max: 5, windowSeconds: 3600 });
  if (!rl.allowed) back("Zu viele Nachrichten von dieser Verbindung. Bitte versuche es später erneut.");

  const {
    data: { user },
  } = await createClient().auth.getUser();

  const { error } = await createAdminClient()
    .from("contact_messages")
    .insert({ name, email, topic, message, user_id: user?.id ?? null });
  if (error) back("Die Nachricht konnte gerade nicht gespeichert werden. Bitte schreib uns direkt per E-Mail.");

  redirect("/kontakt?gesendet=1");
}
