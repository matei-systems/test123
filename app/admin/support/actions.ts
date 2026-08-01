"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePlatformAdmin, logAdminAction } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

// Support-Tier darf Tickets bearbeiten (das ist der Kern ihrer Arbeit) -
// anders als Sperren/Testphase, die Superadmin-only sind, siehe
// app/admin/organizations/actions.ts.
export async function replyToTicket(formData: FormData) {
  const gate = await requirePlatformAdmin("support");
  const ticketId = String(formData.get("ticketId"));
  if (!gate.ok) redirect(`/admin/support/${ticketId}?error=${encodeURIComponent(gate.error)}`);

  const body = String(formData.get("body") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const priority = String(formData.get("priority") ?? "");

  const db = createAdminClient();

  if (body) {
    // is_admin=true - über den Service-Role-Client, weil die RLS-Policy für
    // support_ticket_messages Zeilen von Organisationsmitgliedern bewusst
    // NUR mit is_admin=false zulässt (siehe supabase/schema.sql).
    const { error } = await db.from("support_ticket_messages").insert({
      ticket_id: ticketId,
      author_id: gate.user.id,
      is_admin: true,
      body,
    });
    if (error) redirect(`/admin/support/${ticketId}?error=${encodeURIComponent(error.message)}`);
  }

  if (status || priority) {
    const patch: Record<string, string> = {};
    if (status) patch.status = status;
    if (priority) patch.priority = priority;
    const { error } = await db.from("support_tickets").update(patch).eq("id", ticketId);
    if (error) redirect(`/admin/support/${ticketId}?error=${encodeURIComponent(error.message)}`);
  }

  await logAdminAction(gate.admin.user_id, "reply_ticket", "support_ticket", ticketId, {
    replied: Boolean(body),
    status: status || undefined,
    priority: priority || undefined,
  });
  revalidatePath(`/admin/support/${ticketId}`);
  redirect(`/admin/support/${ticketId}`);
}
