"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { translateDbError } from "@/lib/db-errors";
import { registerWalletObjectsForNewCard } from "@/lib/wallet-updates";

export interface JoinResult {
  error?: string;
  serial?: string;
}

// Öffentlicher Self-Service-Beitritt per QR-Scan. Läuft ohne Login (kein
// Supabase-Auth-Konto für Endkunden), daher zwingend der Admin-Client. Um
// Missbrauch zu vermeiden, wird NIE eine client-übergebene org_id
// akzeptiert - sie kommt ausschließlich aus dem serverseitig geladenen
// Programm, an dessen Bestehen die ganze Aktion gebunden ist.
export async function joinProgram(
  programId: string,
  input: { fullName: string; email: string; honeypot: string }
): Promise<JoinResult> {
  // Honeypot: für Menschen unsichtbares Feld. Bots füllen es oft aus.
  if (input.honeypot) return {};

  const fullName = input.fullName.trim();
  const email = input.email.trim();
  if (!fullName) return { error: "Bitte gib deinen Namen ein." };

  const admin = createAdminClient();
  const { data: program } = await admin
    .from("loyalty_programs")
    .select("id, org_id, active")
    .eq("id", programId)
    .maybeSingle();

  if (!program) return { error: "Dieses Treueprogramm wurde nicht gefunden." };
  if (!program.active) return { error: "Dieses Treueprogramm ist aktuell nicht aktiv." };

  // Bereits eine Karte für dieses Programm mit derselben E-Mail? Dann keine
  // Dublette anlegen, sondern die bestehende Karte zurückgeben.
  if (email) {
    const { data: existingCustomer } = await admin
      .from("customers")
      .select("id")
      .eq("org_id", program.org_id)
      .eq("email", email)
      .maybeSingle();

    if (existingCustomer) {
      const { data: existingCard } = await admin
        .from("cards")
        .select("serial_number")
        .eq("customer_id", existingCustomer.id)
        .eq("program_id", programId)
        .maybeSingle();
      if (existingCard) return { serial: existingCard.serial_number };
    }
  }

  const { data: customer, error: custErr } = await admin
    .from("customers")
    .insert({ org_id: program.org_id, full_name: fullName, email: email || null })
    .select("id")
    .single();
  if (custErr || !customer) return { error: translateDbError(custErr?.message) };

  const { data: card, error: cardErr } = await admin
    .from("cards")
    .insert({ org_id: program.org_id, program_id: programId, customer_id: customer.id })
    .select("id, serial_number")
    .single();
  if (cardErr || !card) return { error: translateDbError(cardErr?.message) };

  registerWalletObjectsForNewCard(card.id).catch(() => {});
  return { serial: card.serial_number };
}
