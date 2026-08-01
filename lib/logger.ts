import * as Sentry from "@sentry/nextjs";

// Dünner Wrapper um console.error + Sentry.captureException - Sentry ist
// ohne SENTRY_DSN ein No-Op (siehe sentry.server.config.ts), daher bleibt
// das Verhalten ohne konfiguriertes Sentry-Konto identisch zu einem reinen
// console.error wie bisher im Rest der App. Für die kritischsten Pfade
// gedacht (Zahlungs-Webhook, Admin-Aktionen), nicht als Pflicht-Ersatz für
// jedes bestehende console.error im Projekt.
export function logError(scope: string, error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}]`, message, context ?? "");
  Sentry.captureException(error, { tags: { scope }, extra: context });
}
