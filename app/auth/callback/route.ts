import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for Supabase email links (signup confirmation and password
// recovery both use the PKCE `code` param). Exchanges it for a real session
// cookie, then continues to `next` (defaults to the dashboard).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=` +
      encodeURIComponent("Dieser Link ist abgelaufen oder ungültig. Bitte fordere einen neuen an.")
  );
}

// Offener-Redirect-Schutz: `next` kommt direkt aus der URL, die jemand
// selbst zusammenbauen kann (z. B. ein manipulierter Bestätigungslink).
// Ohne diese Prüfung ließe sich mit next="@böse-seite.de" nach einem
// ECHTEN, erfolgreichen Login auf eine fremde Domain umleiten (der
// "userinfo@host"-Trick: "http://localhost:3000@böse-seite.de" wird von
// URL-Parsern als Host "böse-seite.de" gelesen) - ein klassischer
// Phishing-Vektor direkt nach der Authentifizierung. Nur echte,
// serverinterne Pfade (genau ein führender "/", kein "//"-Protokoll-
// relativer Pfad) sind erlaubt, alles andere fällt auf /dashboard zurück.
function safeNextPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) {
    return next;
  }
  return "/dashboard";
}
