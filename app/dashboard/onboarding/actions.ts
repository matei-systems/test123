"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { translateDbError } from "@/lib/db-errors";

export async function createOrg(formData: FormData) {
  const name = String(formData.get("name")).trim();
  if (!name) redirect("/dashboard/onboarding?error=" + encodeURIComponent("Bitte gib einen Namen für deinen Betrieb an."));

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const slug =
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6);

  const { error } = await supabase
    .from("organizations")
    .insert({ name, slug, owner_id: user.id });

  if (error) redirect("/dashboard/onboarding?error=" + encodeURIComponent(translateDbError(error.message)));
  redirect("/dashboard");
}
