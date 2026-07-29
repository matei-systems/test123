// Postgres/PostgREST error text is not something to show end users directly
// (RLS policy names, constraint names, etc.). Match on substrings the same
// way lib/auth-errors.ts does for Supabase Auth errors.
export function translateDbError(message: string | undefined | null): string {
  const m = (message ?? "").toLowerCase();

  if (m.includes("row-level security")) return "Du hast keine Berechtigung für diese Aktion.";
  if (m.includes("duplicate key") || m.includes("already exists")) return "Das gibt es bereits.";
  if (m.includes("violates foreign key constraint")) return "Das hängt an Daten, die nicht (mehr) existieren.";
  if (m.includes("violates not-null constraint")) return "Bitte fülle alle Pflichtfelder aus.";
  if (m.includes("invalid input value for enum")) return "Ungültiger Wert ausgewählt.";
  if (m.includes("network") || m.includes("fetch failed")) return "Verbindung fehlgeschlagen. Bitte versuche es erneut.";

  return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
}
