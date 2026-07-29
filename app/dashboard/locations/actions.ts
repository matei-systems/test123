"use server";

import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { translateDbError } from "@/lib/db-errors";

export interface LocationInput {
  name: string;
  address: string;
  city: string;
  postalCode: string;
}

export async function createLocation(input: LocationInput): Promise<{ error?: string; id?: string }> {
  if (!input.name.trim()) return { error: "Bitte gib einen Namen für den Standort an." };

  const gate = await requireOrgRole("admin");
  if (!gate.ok) return { error: gate.error };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("locations")
    .insert({
      org_id: gate.org.id,
      name: input.name.trim(),
      address: input.address.trim() || null,
      city: input.city.trim() || null,
      postal_code: input.postalCode.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error ? translateDbError(error.message) : "Standort konnte nicht angelegt werden." };
  revalidatePath("/dashboard/locations");
  return { id: data.id };
}

export async function updateLocation(id: string, input: LocationInput): Promise<{ error?: string }> {
  if (!input.name.trim()) return { error: "Bitte gib einen Namen für den Standort an." };

  const gate = await requireOrgRole("admin");
  if (!gate.ok) return { error: gate.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("locations")
    .update({
      name: input.name.trim(),
      address: input.address.trim() || null,
      city: input.city.trim() || null,
      postal_code: input.postalCode.trim() || null,
    })
    .eq("id", id)
    .eq("org_id", gate.org.id);

  if (error) return { error: translateDbError(error.message) };
  revalidatePath("/dashboard/locations");
  return {};
}

export async function deleteLocation(id: string): Promise<{ error?: string }> {
  const gate = await requireOrgRole("admin");
  if (!gate.ok) return { error: gate.error };

  const supabase = createClient();
  const { error } = await supabase.from("locations").delete().eq("id", id).eq("org_id", gate.org.id);
  if (error) return { error: translateDbError(error.message) };
  revalidatePath("/dashboard/locations");
  return {};
}
