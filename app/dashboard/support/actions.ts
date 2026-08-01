"use server";

import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { hasMinRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

// Bewusst NICHT über requireOrgRole (das würde bei Testphasen-Ablauf,
// Zahlungsproblemen ODER einer Plattform-Sperre greifen) - Support muss
// IMMER erreichbar sein, gerade WEIL genau diese Fälle der häufigste Grund
// sind, sich zu melden. RLS (is_org_member + created_by/author_id = auth.uid())
// bleibt trotzdem die eigentliche Sicherheitsschicht.
export async function createTicket(formData: FormData) {
  const { user, org, role } = await getCurrentOrg();
  if (!user) redirect("/login");
  if (!org) redirect("/dashboard/onboarding");
  if (!hasMinRole(role, "staff")) redirect("/dashboard/support?error=" + encodeURIComponent("Dafür fehlt dir die Berechtigung."));

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || !body) {
    redirect("/dashboard/support?error=" + encodeURIComponent("Bitte fülle Betreff und Nachricht aus."));
  }

  const supabase = createClient();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({ org_id: org.id, created_by: user.id, subject })
    .select("id")
    .single();
  if (error || !ticket) {
    redirect("/dashboard/support?error=" + encodeURIComponent(error?.message ?? "Fall konnte nicht angelegt werden."));
  }

  const { error: msgErr } = await supabase
    .from("support_ticket_messages")
    .insert({ ticket_id: ticket!.id, author_id: user.id, is_admin: false, body });
  if (msgErr) redirect("/dashboard/support?error=" + encodeURIComponent(msgErr.message));

  redirect(`/dashboard/support/${ticket!.id}`);
}

export async function replyToTicket(formData: FormData) {
  const { user, org, role } = await getCurrentOrg();
  if (!user) redirect("/login");
  if (!org) redirect("/dashboard/onboarding");
  const ticketId = String(formData.get("ticketId"));
  if (!hasMinRole(role, "staff")) redirect(`/dashboard/support/${ticketId}?error=` + encodeURIComponent("Dafür fehlt dir die Berechtigung."));

  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/dashboard/support/${ticketId}?error=` + encodeURIComponent("Bitte gib eine Nachricht ein."));

  const supabase = createClient();
  const { error } = await supabase
    .from("support_ticket_messages")
    .insert({ ticket_id: ticketId, author_id: user.id, is_admin: false, body });
  if (error) redirect(`/dashboard/support/${ticketId}?error=` + encodeURIComponent(error.message));

  redirect(`/dashboard/support/${ticketId}`);
}
