import type { SupabaseClient } from "@supabase/supabase-js";

const STAMP_COOLDOWN_MS = 30_000;

// Blocks rapid repeated stamping of the same card (accidental double-scan or
// deliberate abuse) - schema.sql's own design notes call this out explicitly
// ("Missbrauchserkennung, z. B. 20 Stempel in 1 Minute") but nothing ever
// enforced it until now.
export async function checkStampCooldown(supabase: SupabaseClient, cardId: string): Promise<string | null> {
  const { data } = await supabase
    .from("transactions")
    .select("created_at")
    .eq("card_id", cardId)
    .eq("type", "stamp")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data && Date.now() - new Date(data.created_at).getTime() < STAMP_COOLDOWN_MS) {
    return "Für diese Karte wurde gerade erst ein Stempel vergeben. Bitte kurz warten.";
  }
  return null;
}
