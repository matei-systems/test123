import { createClient as createSbClient } from "@supabase/supabase-js";

// global.fetch mit cache: "no-store" ist hier PFLICHT, nicht optional:
// createAdminClient() liest nie cookies()/headers() (das ist der ganze Sinn
// des Service-Role-Clients für öffentliche/anonyme Routen) - genau die
// Funktionen, über die Next.js sonst automatisch erkennt, dass eine Anfrage
// "dynamisch" ist und fetch() nicht zwischenspeichern darf. Ohne diese
// explizite Option reicht "export const dynamic = force-dynamic" auf der
// aufrufenden Route/dem Route Handler allein NICHT aus - Next.js hat trotzdem
// den allerersten Datenbank-Read über den zugrunde liegenden fetch()-Aufruf
// dauerhaft zwischengespeichert (beim Testen der Live-Update-Funktion in P10
// genau so aufgefallen: der Status-Endpunkt lieferte für immer denselben
// Stempelstand, unabhängig vom tatsächlichen Datenbankinhalt).
export function createAdminClient() {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );
}
