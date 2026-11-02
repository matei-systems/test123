import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-path";

// Landing point for Supabase email links (signup confirmation and password
// recovery both use the PKCE `code` param). Exchanges it for a real session
// cookie, then continues to `next` (defaults to /weiter, the role-based entry).
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
