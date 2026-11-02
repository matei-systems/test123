"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { translateDbError } from "@/lib/db-errors";
import { registerWalletObjectsForNewCard } from "@/lib/wallet-updates";
import { computeBillingInfo } from "@/lib/billing/access";
import { checkRateLimit } from "@/lib/rate-limit";

export interface JoinResult {
  error?: string;
  serial?: string;
}

// Karten, die auf DIESEM Gerät ohne Konto erstellt wurden (httpOnly-Cookie,
// nur Seriennummern). Ersetzt die frühere Dubletten-Erkennung per E-Mail:
// Die gab jedem, der eine fremde E-Mail-Adresse eintippte, die bestehende
// Karte dieser Person zurück - samt QR-Code, mit dem man an der Kasse deren
// Belohnung hätte einlösen können.
const DEVICE_COOKIE = "matei_karten";
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function loadJoinableProgram(programId: string) {
  const admin = createAdminClient();
  const { data: program } = await admin
    .from("loyalty_programs")
    .select("id, org_id, active, organizations(name, admin_suspended, subscription_status, trial_ends_at, cancel_at_period_end, current_period_end)")
    .eq("id", programId)
    .maybeSingle();
  if (!program) return { error: "Dieses Treueprogramm wurde nicht gefunden." } as const;
  if (!program.active) return { error: "Dieses Treueprogramm ist aktuell nicht aktiv." } as const;
  const org = (program as any).organizations;
  if (!org || org.admin_suspended || computeBillingInfo(org).state === "restricted") {
    return { error: "Dieses Geschäft nimmt gerade keine neuen Karten an. Bitte frag direkt vor Ort nach." } as const;
  }
  return { program: program as { id: string; org_id: string; active: boolean } } as const;
}

// Öffentlicher Beitritt ohne Konto. Die org_id kommt ausschließlich aus dem
// serverseitig geladenen Programm, nie vom Client.
export async function joinProgram(
  programId: string,
  input: { fullName: string; email: string; honeypot: string }
): Promise<JoinResult> {
  if (input.honeypot) return {};

  const fullName = input.fullName.trim().slice(0, 120);
  const email = input.email.trim().slice(0, 200);
  if (!fullName) return { error: "Bitte gib deinen Namen ein." };
  if (email && !EMAIL_RX.test(email)) return { error: "Bitte gib eine gültige E-Mail-Adresse ein oder lass das Feld leer." };

  const rl = await checkRateLimit("join", { max: 20, windowSeconds: 3600 });
  if (!rl.allowed) return { error: "Zu viele neue Karten von dieser Verbindung. Bitte versuche es später erneut." };

  const loaded = await loadJoinableProgram(programId);
  if ("error" in loaded) return { error: loaded.error };
  const { program } = loaded;
  const admin = createAdminClient();

  // Dieses Gerät hat für dieses Programm schon eine Karte erstellt? Dann
  // dieselbe zurückgeben statt eine Dublette anzulegen.
  const jar = cookies();
  const known = (jar.get(DEVICE_COOKIE)?.value ?? "").split(",").filter((s) => /^[0-9a-f-]{36}$/i.test(s)).slice(-20);
  if (known.length) {
    const { data: existing } = await admin
      .from("cards")
      .select("serial_number")
      .eq("program_id", programId)
      .in("serial_number", known)
      .limit(1)
      .maybeSingle();
    if (existing) return { serial: existing.serial_number };
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

  jar.set(DEVICE_COOKIE, [...known, card.serial_number].slice(-20).join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  registerWalletObjectsForNewCard(card.id).catch(() => {});
  return { serial: card.serial_number };
}

// Beitritt mit Kundenkonto: Karte landet direkt im Wallet. Bestehender
// Kundendatensatz und bestehende Karte desselben Kontos werden wiederverwendet.
export async function joinProgramAsUser(programId: string) {
  const {
    data: { user },
  } = await createClient().auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/j/${programId}`)}`);

  const loaded = await loadJoinableProgram(programId);
  if ("error" in loaded) redirect(`/j/${programId}?fehler=${encodeURIComponent(loaded.error!)}`);
  const { program } = loaded as { program: { id: string; org_id: string } };
  const admin = createAdminClient();

  let customerId: string | null = null;
  const { data: existingCustomers } = await admin
    .from("customers")
    .select("id")
    .eq("org_id", program.org_id)
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true });
  const customerIds = (existingCustomers ?? []).map((c) => c.id);

  if (customerIds.length) {
    const { data: existingCard } = await admin
      .from("cards")
      .select("id")
      .eq("program_id", programId)
      .in("customer_id", customerIds)
      .limit(1)
      .maybeSingle();
    if (existingCard) redirect(`/konto/karten/${existingCard.id}`);
    customerId = customerIds[0];
  }

  // Datensparsam: Das Geschäft erhält nur den Namen, nicht die E-Mail des
  // Kontos (die hat der Kunde dem Geschäft nicht ausdrücklich gegeben).
  if (!customerId) {
    const { data: profile } = await admin.from("profiles").select("full_name").eq("id", user!.id).maybeSingle();
    const name = profile?.full_name?.trim() || user!.email?.split("@")[0] || "Kunde";
    const { data: created, error } = await admin
      .from("customers")
      .insert({ org_id: program.org_id, full_name: name, email: null, user_id: user!.id })
      .select("id")
      .single();
    if (error || !created) redirect(`/j/${programId}?fehler=${encodeURIComponent(translateDbError(error?.message))}`);
    customerId = created!.id;
  }

  const { data: card, error: cardErr } = await admin
    .from("cards")
    .insert({ org_id: program.org_id, program_id: programId, customer_id: customerId })
    .select("id")
    .single();
  if (cardErr || !card) redirect(`/j/${programId}?fehler=${encodeURIComponent(translateDbError(cardErr?.message))}`);

  registerWalletObjectsForNewCard(card!.id).catch(() => {});
  redirect(`/konto/karten/${card!.id}?neu=1`);
}
