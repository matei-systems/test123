import type { MetadataRoute } from "next";
import { listPublicBusinesses } from "@/lib/directory";

// Öffentliche Seiten + freigeschaltete Geschäftsprofile. Kundenkarten
// (/c/...), Beitritts-Links (/j/...) und alle Konto-/Dashboard-Bereiche
// gehören nicht in den Suchindex.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const paths = ["/", "/fuer-kunden", "/fuer-geschaefte", "/geschaefte", "/faq", "/kontakt", "/dienstleistungen", "/impressum", "/datenschutz", "/agb", "/avv"];
  const { businesses } = await listPublicBusinesses({ limit: 1000 });
  return [
    ...paths.map((path) => ({ url: `${base}${path}`, lastModified: new Date() })),
    ...businesses.map((b) => ({ url: `${base}/geschaefte/${b.slug}`, lastModified: new Date() })),
  ];
}
