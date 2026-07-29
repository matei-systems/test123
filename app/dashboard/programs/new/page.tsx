import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { hasMinRole } from "@/lib/permissions";
import ProgramWizard from "@/components/programs/ProgramWizard";

export const dynamic = "force-dynamic";

export default async function NewProgramPage() {
  const { org, role } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");
  if (!hasMinRole(role, "admin")) redirect("/dashboard/programs");

  return (
    <div>
      <Link href="/dashboard/programs" className="text-sm text-[#A6A099] hover:text-gold-bright transition-colors">
        ← Programme
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mt-3 mb-1">Neues Programm</h1>
      <p className="text-[#A6A099] text-sm mb-6">Gestalte deine digitale Treuekarte in wenigen Schritten.</p>
      <ProgramWizard mode="create" />
    </div>
  );
}
