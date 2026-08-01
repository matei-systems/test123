import type { MetadataRoute } from "next";

// Nur die statischen Marketing-/Rechtsseiten - /c/[serial] (Kundenkarten)
// und /j/[programId] (Beitritts-Links) sind pro Betrieb und unbegrenzt
// viele, gehören nicht in eine globale Sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const paths = ["/", "/impressum", "/datenschutz", "/agb", "/avv"];
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
