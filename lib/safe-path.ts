// Offener-Redirect-Schutz: `next` kommt aus der URL und kann manipuliert sein
// (z. B. next="//böse-seite.de" oder "/\\böse-seite.de"). Erlaubt sind nur
// serverinterne Pfade mit genau einem führenden "/".
export function safeNextPath(next: string | null | undefined, fallback = "/weiter"): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") && !/[\r\n]/.test(next)) {
    return next;
  }
  return fallback;
}
