/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint beim Build nicht abbrechen lassen (MVP)
  eslint: { ignoreDuringBuilds: true },
};
module.exports = nextConfig;
