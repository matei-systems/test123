"use server";

import { randomUUID } from "crypto";
import { requireOrgRole } from "@/lib/org";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 4_000_000; // 4MB - Client resized/komprimiert vorher schon deutlich kleiner
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function uploadCardImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const gate = await requireOrgRole("admin");
  if (!gate.ok) return { error: gate.error };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Keine Datei erhalten." };
  if (!ALLOWED_TYPES.has(file.type)) return { error: "Bitte PNG, JPG oder WEBP verwenden." };
  if (file.size > MAX_BYTES) return { error: "Die Datei ist zu groß." };

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${gate.org.id}/${randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from("card-assets").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { error: "Bild konnte nicht hochgeladen werden. Bitte erneut versuchen." };

  const { data } = admin.storage.from("card-assets").getPublicUrl(path);
  return { url: data.publicUrl };
}
