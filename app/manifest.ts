import type { MetadataRoute } from "next";

// Web-App-Manifest: Matei lässt sich auf dem Handy wie eine App auf den
// Startbildschirm legen. Start über /weiter = rollenabhängig ins Wallet
// (Kunden) oder ins Dashboard (Geschäfte), ohne Login zur Anmeldung.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Matei Systems – Treuekarten",
    short_name: "Matei",
    description: "Digitale Treuekarten lokaler Geschäfte: sammeln, einlösen, wiederkommen.",
    id: "/",
    start_url: "/weiter",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF6EF",
    theme_color: "#FAF6EF",
    lang: "de",
    categories: ["shopping", "lifestyle", "business"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Mein Wallet", url: "/konto", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Kassen-Scanner", url: "/dashboard/scan", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
