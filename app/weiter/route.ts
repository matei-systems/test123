import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Rollenabhängiger Einstieg nach Login/Registrierung/E-Mail-Bestätigung:
// Mitglied eines Betriebs -> Dashboard, sonst Kundenkonto. (Plattform-Admins
// erreichen /admin zusätzlich über die Navigation.)
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const { count } = await supabase.from("memberships").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if ((count ?? 0) > 0) return NextResponse.redirect(`${origin}/dashboard`);

  const intent = (user.user_metadata as any)?.account_type;
  if (intent === "geschaeft") return NextResponse.redirect(`${origin}/dashboard/onboarding`);
  return NextResponse.redirect(`${origin}/konto`);
}
