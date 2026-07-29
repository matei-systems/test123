// Supabase/GoTrue error messages come back in English with a mix of message
// text and status codes across SDK versions. Match on substrings rather than
// exact strings so we degrade gracefully instead of leaking the raw text.
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) return "E-Mail oder Passwort ist falsch.";
  if (m.includes("email not confirmed")) return "Bitte bestätige zuerst deine E-Mail-Adresse. Wir haben dir einen Link geschickt.";
  if (m.includes("user already registered") || m.includes("already registered"))
    return "Für diese E-Mail-Adresse existiert bereits ein Konto. Bitte melde dich an.";
  if (m.includes("password should be at least") || m.includes("password should contain"))
    return "Das Passwort ist zu schwach. Mindestens 6 Zeichen.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "Diese E-Mail-Adresse ist ungültig.";
  if (m.includes("rate limit") || m.includes("only request this after"))
    return "Zu viele Versuche. Bitte warte kurz und versuche es erneut.";
  if (m.includes("token has expired") || m.includes("invalid or expired") || m.includes("expired"))
    return "Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen an.";
  if (m.includes("same password") || m.includes("different from the old"))
    return "Das neue Passwort muss sich vom aktuellen unterscheiden.";
  if (m.includes("network") || m.includes("fetch failed"))
    return "Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.";

  return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
}
