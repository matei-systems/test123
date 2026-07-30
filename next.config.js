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
  experimental: {
    serverComponentsExternalPackages: ["@napi-rs/canvas"],
  },
};
module.exports = nextConfig;
