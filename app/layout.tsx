import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import RegisterSW from "@/components/ui/RegisterSW";

// Schriften werden von next/font beim Build heruntergeladen und von der
// eigenen Domain ausgeliefert (kein Aufruf zu Google im Browser, passt zur
// CSP font-src 'self').
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap", axes: ["opsz"] });

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://matei.systems";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Matei Systems – Digitale Treuekarten für lokale Geschäfte",
    template: "%s · Matei Systems",
  },
  description:
    "Sammle Stempel und Punkte bei lokalen Geschäften – ohne Papierkarte. Für Geschäfte: digitale Treueprogramme mit Wallet-Karte, QR-Scan und fairen Belohnungen.",
  applicationName: "Matei Systems",
  appleWebApp: { capable: true, title: "Matei", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    locale: "de_AT",
    siteName: "Matei Systems",
    title: "Matei Systems – Treue, die bleibt.",
    description: "Digitale Treuekarten für lokale Geschäfte. Sammeln, einlösen, wiederkommen.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6EF" },
    { media: "(prefers-color-scheme: dark)", color: "#14110F" },
  ],
};

// Setzt das gespeicherte Farbschema vor dem ersten Zeichnen (kein Aufblitzen).
// Standard ist das helle Markendesign; "system" folgt der Geräteeinstellung.
const themeScript = `try{var t=localStorage.getItem("matei-theme");if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-paper"
        >
          Zum Inhalt springen
        </a>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
