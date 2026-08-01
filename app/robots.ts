import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Dashboard/Admin sind ohnehin loginpflichtig (nichts Sensibles wird
        // dadurch "versteckt"), aber sie gehören nicht in einen Suchindex -
        // reine Anwendungsoberfläche, kein öffentlicher Inhalt.
        disallow: ["/dashboard", "/admin", "/api"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
