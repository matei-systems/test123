"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrgRole } from "@/lib/org";
import { ledgerError } from "@/lib/ledger";
import { CATEGORIES } from "@/lib/directory";
import { instagramUrl, safeUrl } from "@/lib/programs";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function back(msg: string, ok = false): never {
  redirect(`/dashboard/profil?${ok ? "ok" : "fehler"}=` + encodeURIComponent(msg));
}

function text(formData: FormData, key: string, max: number) {
  const v = String(formData.get(key) ?? "").trim();
  return v ? v.slice(0, max) : null;
}

// Speichert das Geschäftsprofil (nur Inhaber/Admin; RLS bp_admin_update).
// intent=submit reicht zusätzlich zur Prüfung ein - ob das Profil dafür
// vollständig ist, prüft der Datenbank-Trigger (MATEI_PROFILE_INCOMPLETE).
// Slug, Freigabe-Zeitpunkt und "approved" kann nur die Plattform setzen.
export async function saveProfile(formData: FormData) {
  const gate = await requireOrgRole("admin", { requireActive: false });
  if (!gate.ok) back(gate.error);

  const displayName = text(formData, "display_name", 80);
  if (!displayName || displayName.length < 2) back("Bitte gib den Namen deines Geschäfts an.");

  const category = String(formData.get("category") ?? "");
  const websiteRaw = text(formData, "website", 200);
  const website = websiteRaw ? safeUrl(websiteRaw) : null;
  if (websiteRaw && !website) back("Die Website-Adresse ist ungültig. Bitte im Format https://… angeben.");
  const instaRaw = text(formData, "instagram", 80);
  if (instaRaw && !instagramUrl(instaRaw)) back("Der Instagram-Name ist ungültig (nur Buchstaben, Ziffern, Punkt, Unterstrich).");
  const email = text(formData, "public_email", 200);
  if (email && !EMAIL.test(email)) back("Die öffentliche E-Mail-Adresse ist ungültig.");
  const logo = text(formData, "logo_url", 500);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (logo && !logo.startsWith(`${supabaseUrl}/storage/v1/object/public/card-assets/${gate.ok ? gate.org.id : ""}/`)) {
    back("Bitte lade das Logo über den Upload-Button hoch.");
  }

  const hours = [0, 1, 2, 3, 4, 5, 6].map((day) => {
    const closed = formData.get(`closed_${day}`) === "on";
    const open = String(formData.get(`open_${day}`) ?? "");
    const close = String(formData.get(`close_${day}`) ?? "");
    if (closed || !open || !close) return { day, closed: true };
    if (!TIME.test(open) || !TIME.test(close)) back("Bitte gib Öffnungszeiten im Format HH:MM an.");
    if (close <= open) back("Bei den Öffnungszeiten muss „bis“ nach „von“ liegen.");
    return { day, closed: false, open, close };
  });

  const intent = String(formData.get("intent") ?? "save");
  const update: Record<string, unknown> = {
    display_name: displayName,
    tagline: text(formData, "tagline", 120),
    description: text(formData, "description", 1500),
    category: category in CATEGORIES ? category : null,
    logo_url: logo,
    address: text(formData, "address", 160),
    postal_code: text(formData, "postal_code", 12),
    city: text(formData, "city", 80),
    phone: text(formData, "phone", 40),
    website,
    public_email: email,
    instagram: instaRaw ? instaRaw.replace(/^@/, "") : null,
    opening_hours: hours,
    hours_note: text(formData, "hours_note", 200),
  };

  const supabase = createClient();
  const { data: current } = await supabase.from("business_profiles").select("listing_status").eq("org_id", gate.ok ? gate.org.id : "").maybeSingle();
  if (!current) back("Für deinen Betrieb wurde noch kein Profil gefunden. Bitte lade die Seite neu.");
  if (intent === "submit") {
    if (!["draft", "rejected"].includes(current!.listing_status)) back("Das Profil ist bereits eingereicht oder freigeschaltet.");
    update.listing_status = "pending";
    update.is_listed = true;
  }

  const { error } = await supabase.from("business_profiles").update(update).eq("org_id", gate.ok ? gate.org.id : "");
  if (error) back(ledgerError(error.message));

  revalidatePath("/dashboard/profil");
  revalidatePath("/geschaefte");
  back(intent === "submit" ? "Profil zur Prüfung eingereicht. Wir melden uns, sobald es freigeschaltet ist." : "Profil gespeichert.", true);
}

export async function withdrawSubmission() {
  const gate = await requireOrgRole("admin", { requireActive: false });
  if (!gate.ok) back(gate.error);
  const { error } = await createClient().from("business_profiles").update({ listing_status: "draft" }).eq("org_id", gate.org.id).eq("listing_status", "pending");
  if (error) back(ledgerError(error.message));
  revalidatePath("/dashboard/profil");
  back("Einreichung zurückgezogen – das Profil ist wieder ein Entwurf.", true);
}

export async function setListed(listed: boolean) {
  const gate = await requireOrgRole("admin", { requireActive: false });
  if (!gate.ok) back(gate.error);
  const { error } = await createClient().from("business_profiles").update({ is_listed: listed }).eq("org_id", gate.org.id);
  if (error) back(ledgerError(error.message));
  revalidatePath("/dashboard/profil");
  revalidatePath("/geschaefte");
  back(listed ? "Dein Profil wird wieder im Verzeichnis angezeigt." : "Dein Profil ist im Verzeichnis ausgeblendet.", true);
}
