"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrgRole } from "@/lib/org";
import { ledgerError } from "@/lib/ledger";
import { viennaDateTimeToIso } from "@/lib/vienna-time";

// Aktionen: "multiplier" (Faktor 2-5 auf jede Buchung, wirkt serverseitig in
// earn_on_card) oder "announcement" (reiner Hinweis im Profil/Wallet).
// Nur Inhaber/Admin (RLS camp_* = is_org_admin).

function back(msg: string, ok = false): never {
  redirect(`/dashboard/aktionen?${ok ? "ok" : "fehler"}=` + encodeURIComponent(msg));
}

export async function createCampaign(formData: FormData) {
  const g = await requireOrgRole("admin", { requireActive: false });
  if (!g.ok) back(g.error);

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const description = String(formData.get("description") ?? "").trim().slice(0, 300) || null;
  const type = formData.get("type") === "multiplier" ? "multiplier" : "announcement";
  const factor = Number(formData.get("factor"));
  const programId = String(formData.get("program_id") ?? "") || null;
  const startsAt = viennaDateTimeToIso(String(formData.get("starts_at") ?? "")) ?? new Date().toISOString();
  const endsAt = viennaDateTimeToIso(String(formData.get("ends_at") ?? ""));

  if (name.length < 2) back("Bitte gib der Aktion einen Namen.");
  if (type === "multiplier" && (!Number.isInteger(factor) || factor < 2 || factor > 5)) back("Der Faktor muss zwischen 2 und 5 liegen.");
  if (type === "multiplier" && !endsAt) back("Eine Multiplikator-Aktion braucht ein Enddatum.");
  if (endsAt && endsAt <= startsAt) back("Das Ende muss nach dem Start liegen.");
  if (endsAt && new Date(endsAt).getTime() - new Date(startsAt).getTime() > 92 * 86_400_000) back("Eine Aktion darf höchstens drei Monate laufen.");

  const supabase = createClient();
  if (programId) {
    const { data } = await supabase.from("loyalty_programs").select("id").eq("id", programId).eq("org_id", g.org.id).maybeSingle();
    if (!data) back("Dieses Programm gehört nicht zu deinem Betrieb.");
  }

  const { error } = await supabase.from("campaigns").insert({
    org_id: g.org.id,
    program_id: programId,
    name,
    description,
    type,
    config: type === "multiplier" ? { factor } : {},
    starts_at: startsAt,
    ends_at: endsAt,
    active: true,
  });
  if (error) back(ledgerError(error.message));
  revalidatePath("/dashboard/aktionen");
  back(`Aktion „${name}“ angelegt.`, true);
}

export async function setCampaignActive(id: string, active: boolean) {
  const g = await requireOrgRole("admin", { requireActive: false });
  if (!g.ok) back(g.error);
  const { error } = await createClient().from("campaigns").update({ active }).eq("id", id).eq("org_id", g.org.id);
  if (error) back(ledgerError(error.message));
  revalidatePath("/dashboard/aktionen");
  back(active ? "Aktion wieder aktiv." : "Aktion pausiert.", true);
}

export async function endCampaign(id: string) {
  const g = await requireOrgRole("admin", { requireActive: false });
  if (!g.ok) back(g.error);
  const { error } = await createClient().from("campaigns").update({ ends_at: new Date().toISOString() }).eq("id", id).eq("org_id", g.org.id);
  if (error) back(ledgerError(error.message));
  revalidatePath("/dashboard/aktionen");
  back("Aktion beendet.", true);
}

export async function deleteCampaign(id: string) {
  const g = await requireOrgRole("admin", { requireActive: false });
  if (!g.ok) back(g.error);
  const { error } = await createClient().from("campaigns").delete().eq("id", id).eq("org_id", g.org.id);
  if (error) back(ledgerError(error.message));
  revalidatePath("/dashboard/aktionen");
  back("Aktion gelöscht.", true);
}
