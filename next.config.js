const { withSentryConfig } = require("@sentry/nextjs");

// Sicherheits-Header für jede Antwort (P15) - eine SaaS-Plattform mit
// Login, Zahlungsdaten-Verwaltung und einem Admin-Panel sollte diese von
// Anfang an setzen, nicht erst nachträglich als Reaktion auf einen Fund.
// CSP bewusst mit 'unsafe-inline' für Styles (Tailwind + einige inline
// style={{}}-Attribute im gesamten Code) - eine strikte nonce-basierte CSP
// wäre ein größerer, eigenständiger Umbau und ist hier nicht das Ziel.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
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
  experimental: {
    serverComponentsExternalPackages: ["@napi-rs/canvas"],
    instrumentationHook: true,
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
