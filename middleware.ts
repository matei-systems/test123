import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // /api/* ausgeschlossen (P15-Performance-Audit): jede Route darunter
  // nutzt createAdminClient() (Service-Role, keine Cookie-Session) statt
  // einer Nutzer-Session - die Middleware hätte dort bei jedem Aufruf
  // unnötig einen Supabase-Auth-Refresh gemacht, u. a. bei der P10-
  // Live-Aktualisierung, die /api/cards/[serial]/status wiederholt abfragt.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
