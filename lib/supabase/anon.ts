import { createClient as createSbClient } from "@supabase/supabase-js";

// Client ohne Nutzer-Session für öffentliche Seiten (Verzeichnis, Profile,
// Startseite). Liefert garantiert die anonyme Sicht - die RLS-Policies
// lassen hier nur freigeschaltete, nicht gesperrte Betriebe mit aktivem Abo
// durch. Bewusst getrennt vom Session-Client, damit z. B. ein eingeloggter
// Inhaber im Verzeichnis nicht sein eigenes, noch ungeprüftes Profil sieht.
export function createAnonClient() {
  return createSbClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
