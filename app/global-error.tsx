"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Fängt Fehler ab, die im Root-Layout selbst passieren (extrem selten) -
// muss deshalb sein eigenes <html>/<body> mitbringen und darf sich nicht
// auf globals.css/Tailwind-Klassen verlassen, die über genau dieses Layout
// geladen werden. Reine Inline-Styles als bewusste Ausnahme zur sonstigen
// Tailwind-Konvention dieses Projekts.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body style={{ margin: 0, background: "#FAF6EF", color: "#14110F", fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Etwas ist schiefgelaufen</h1>
            <p style={{ color: "#574E45", fontSize: 14, marginBottom: 24 }}>
              Der Fehler wurde automatisch protokolliert. Bitte lade die Seite neu.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#9C5A18",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Erneut versuchen
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
