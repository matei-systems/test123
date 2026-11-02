import type { Metadata } from "next";
import PublicShell from "@/components/site/PublicShell";
import LandingPage from "@/components/marketing/LandingPage";

export const metadata: Metadata = {
  title: "Für Geschäfte – digitales Treueprogramm",
  description:
    "Stempel- oder Punkteprogramm in wenigen Minuten: QR-Scan mit jedem Handy, eigene Belohnungen und Aktionen, Überblick über Kunden und Buchungen. 14 Tage kostenlos testen.",
};

export default function FuerGeschaeftePage() {
  return (
    <PublicShell>
      <LandingPage />
    </PublicShell>
  );
}
