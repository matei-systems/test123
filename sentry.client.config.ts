// Client-seitige Sentry-Initialisierung (Browser). Bewusst inaktiv, bis
// NEXT_PUBLIC_SENTRY_DSN gesetzt ist - Sentry.init() mit dsn: undefined ist
// laut Sentry-SDK-Doku ein dokumentierter No-Op, genau wie das
// "vorbereitet, aber inaktiv"-Muster bei Stripe/Resend in diesem Projekt.
import * as Sentry from "@sentry/nextjs";

// Bewusst OHNE Session-Replay-Integration: die zieht laut Testbuild allein
// ~110kB zusätzliches JS in jede Seite (unabhängig davon, ob ein DSN
// konfiguriert ist, da der Import statisch gebündelt wird) - für eine
// Plattform, die in derselben Phase auf Performance optimiert wird, steht
// das in keinem Verhältnis zum Nutzen. Reines Error-Tracking reicht hier.
// tracesSampleRate: 0 - P15 will Fehler-Monitoring, kein volles APM/
// Performance-Tracing (das bringt eigenes Bundle-Gewicht mit, siehe
// Kommentar oben zu Replay). Bei Bedarf später gezielt aktivierbar.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
});
