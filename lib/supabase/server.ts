import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-seitiger Client. Respektiert RLS (nutzt den Anon-Key + User-Session).
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // In reinen Server Components ist set() nicht erlaubt -> ignorieren.
          }
        },
      },
      // Explizit, statt sich allein auf die automatische Dynamic-Erkennung
      // durch cookies() zu verlassen - siehe ausführliche Begründung in
      // lib/supabase/admin.ts.
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );
}
