// Server-seitige Sentry-Initialisierung (Node-Runtime: Server Components,
// Server Actions, Route Handler). Inaktiv, bis SENTRY_DSN gesetzt ist.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0,
});
