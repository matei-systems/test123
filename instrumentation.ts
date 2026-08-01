// Next.js' Instrumentation-Hook: lädt die passende Sentry-Konfiguration je
// nach Runtime, in der der Server gerade startet (Node vs. Edge/middleware).
// Der Browser-Teil (sentry.client.config.ts) wird separat automatisch von
// withSentryConfig() in next.config.js eingebunden.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
