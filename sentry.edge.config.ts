// Sentry-Initialisierung für die Edge-Runtime (middleware.ts läuft dort).
// Inaktiv, bis SENTRY_DSN gesetzt ist.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0,
});
