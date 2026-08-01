"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Gemeinsame Darstellung für alle error.tsx-Boundaries (Root, Dashboard,
// Admin) - meldet den Fehler an Sentry (No-Op ohne DSN, siehe
// sentry.client.config.ts) und zeigt eine Seite im bestehenden
// Gold/Charcoal-Design statt des unformatierten Next.js-Standardfehlers.
export default function ErrorState({
  error,
  reset,
  fullPage = false,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  fullPage?: boolean;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const content = (
    <div className="max-w-md w-full text-center">
      <div className="w-12 h-12 mx-auto mb-5 rounded-xl grid place-items-center bg-[rgba(239,68,68,0.12)]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold tracking-tight mb-2">Etwas ist schiefgelaufen</h1>
      <p className="text-dim text-sm mb-6">
        Der Fehler wurde automatisch protokolliert. Bitte versuche es erneut, oder kontaktiere den Support, falls das Problem bestehen bleibt.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button onClick={reset} className="btn btn-primary text-sm">
          Erneut versuchen
        </button>
        <a href="/dashboard" className="btn btn-ghost text-sm">
          Zum Dashboard
        </a>
      </div>
    </div>
  );

  if (!fullPage) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]">{content}</div>;
  }

  return <main className="min-h-screen flex items-center justify-center px-6 bg-ink text-[#F4F1EC]">{content}</main>;
}
