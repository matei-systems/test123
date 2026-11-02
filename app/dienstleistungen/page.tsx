import type { Metadata } from "next";
import PublicShell from "@/components/site/PublicShell";
import ServicesClient from "@/components/marketing/ServicesClient";

export const metadata: Metadata = { title: "Weitere Dienstleistungen" };

export default function DienstleistungenPage() {
  return (
    <PublicShell>
      <ServicesClient />
    </PublicShell>
  );
}
