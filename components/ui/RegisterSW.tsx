"use client";

import { useEffect } from "react";

// Registriert den Offline-Service-Worker (nur in Produktion, nur wenn der
// Browser es unterstützt). Fehler sind unkritisch - die Seite funktioniert
// auch ohne.
export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
