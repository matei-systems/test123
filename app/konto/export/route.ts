import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllHistory, getWalletCards } from "@/lib/konto";

export const dynamic = "force-dynamic";

// Datenauskunft/Datenübertragbarkeit (DSGVO Art. 15/20): alles, was diesem
// Konto zugeordnet ist, als JSON-Datei. Nur eigene Daten (RLS + Filter).
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const [{ data: profile }, { cards }] = await Promise.all([
    supabase.from("profiles").select("email, full_name, created_at, terms_accepted_at, terms_version").eq("id", user.id).maybeSingle(),
    getWalletCards(supabase, user.id),
  ]);
  const history = await getAllHistory(
    supabase,
    cards.map((c) => c.id),
    5000
  );
  const { data: codes } = await supabase
    .from("redemption_requests")
    .select("short_code, status, created_at, expires_at, used_at, card_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const body = {
    exportiert_am: new Date().toISOString(),
    konto: { id: user.id, email: user.email, erstellt_am: user.created_at, profil: profile },
    karten: cards.map((c) => ({
      id: c.id,
      seriennummer: c.serial_number,
      geschaeft: c.business?.display_name ?? null,
      programm: c.program?.title || c.program?.name,
      typ: c.program?.type,
      stempel: c.stamps,
      punkte: c.points,
      status: c.status,
      erstellt_am: c.created_at,
    })),
    buchungen: history,
    einloese_codes: codes ?? [],
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="matei-meine-daten-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
