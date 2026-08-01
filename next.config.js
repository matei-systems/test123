const { withSentryConfig } = require("@sentry/nextjs");

// Sicherheits-Header für jede Antwort (P15) - eine SaaS-Plattform mit
// Login, Zahlungsdaten-Verwaltung und einem Admin-Panel sollte diese von
// Anfang an setzen, nicht erst nachträglich als Reaktion auf einen Fund.
// CSP bewusst mit 'unsafe-inline' für Styles (Tailwind + einige inline
// style={{}}-Attribute im gesamten Code) - eine strikte nonce-basierte CSP
// wäre ein größerer, eigenständiger Umbau und ist hier nicht das Ziel.
// 'unsafe-eval' nur im Dev-Modus (Next.js' React-Refresh/eval-basierte
// Sourcemaps brauchen es) - production build/scan-Seite (jsqr, reines JS,
// kein WASM) kommt ohne aus, geprüft per Grep über den kompletten Code
// inkl. node_modules/jsqr.
const scriptSrc = ["'self'", "'unsafe-inline'", ...(process.env.NODE_ENV !== "production" ? ["'unsafe-eval'"] : [])];
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src ${scriptSrc.join(" ")}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.sentry.io https://*.ingest.sentry.io",
      "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint beim Build nicht abbrechen lassen (MVP)
  eslint: { ignoreDuringBuilds: true },
  // @napi-rs/canvas bringt eine native .node-Binärdatei mit (P11:
  // Wallet-Kartenbild-Rendering, lib/card-render.ts). Ohne diese Option
  // versucht Webpack, sie über die "use server"-Grenze hinweg mit ins
  // Client-Bundle zu packen (transitiv über actions.ts -> wallet-updates.ts
  // -> card-render.ts) und bricht mit "Module parse failed" ab - das Paket
  // gehört rein serverseitig ausgeführt (require zur Laufzeit), nie gebündelt.
  // instrumentationHook: Next.js' Hook für instrumentation.ts (P15,
  // Sentry-Serverstart) - in dieser Next-Version noch experimentell/
  // standardmäßig aus, anders als ab Next 15.
  // Next.js begrenzt Server-Action-Anfragen standardmäßig auf 1MB - der
  // Bild-Upload (app/dashboard/programs/upload-actions.ts) erlaubt aber
  // bewusst bis zu 4MB. Ohne dieses Limit würde jeder Upload zwischen 1
  // und 4MB mit einem rohen Next.js-Fehler statt der eigenen, verständlichen
  // Validierungsmeldung scheitern (im Rahmen des P15-Audits gefunden).
  experimental: {
    serverComponentsExternalPackages: ["@napi-rs/canvas"],
    instrumentationHook: true,
    serverActions: { bodySizeLimit: "5mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// withSentryConfig lädt Source-Maps zu Sentry hoch und bündelt die
// Sentry-Instrumentierung - läuft ohne SENTRY_DSN/SENTRY_AUTH_TOKEN einfach
// mit deaktiviertem Upload durch (silent: true unterdrückt dabei nur die
// Build-Logs, keine Fehlerbehandlung).
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  webpack: { treeshake: { removeDebugLogging: true, removeTracing: true } },
});
