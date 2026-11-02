import type { Metadata } from "next";
import Logo from "@/components/ui/Logo";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

// Wird vom Service Worker (public/sw.js) angezeigt, wenn keine Verbindung
// besteht. Bewusst ohne Datenabfragen, damit sie statisch zwischengespeichert
// werden kann.
export default function OfflinePage() {
  return (
    <main id="inhalt" className="grid min-h-screen place-items-center bg-paper p-6 text-center">
      <div className="max-w-sm">
        <div className="flex justify-center">
          <Logo href={null} />
        </div>
        <h1 className="mt-8 font-display text-3xl font-semibold">Gerade keine Verbindung</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Deine Karten und Punktestände kommen immer live vom Server, damit sie stimmen. Sobald du wieder online bist, geht es weiter.
        </p>
        <a href="/weiter" className="btn btn-primary mt-6">
          Erneut versuchen
        </a>
      </div>
    </main>
  );
}
