import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import Scanner from "@/components/scan/Scanner";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const { org } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Scannen</h1>
      <p className="text-[#A6A099] text-sm mb-6">Kunden-QR-Code scannen, um Stempel zu vergeben oder Belohnungen einzulösen.</p>
      <Scanner />
    </div>
  );
}
