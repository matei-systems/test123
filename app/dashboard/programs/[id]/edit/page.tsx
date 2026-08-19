import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { hasMinRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { resolveDesign } from "@/lib/card-design";
import ProgramWizard from "@/components/programs/ProgramWizard";
import type { ProgramInput } from "@/app/dashboard/programs/actions";

export const dynamic = "force-dynamic";

export default async function EditProgramPage({ params }: { params: { id: string } }) {
  const { org, role } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");
  if (!hasMinRole(role, "admin")) redirect(`/dashboard/programs/${params.id}`);

  const supabase = createClient();
  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("id", params.id)
    .eq("org_id", org.id)
    .single();
  if (!program) notFound();

  const initial: ProgramInput = {
    name: program.name,
    title: program.title ?? "",
    type: program.type,
    stampsRequired: program.stamps_required,
    pointsPerReward: program.points_per_reward,
    rewardDescription: program.reward_description ?? "",
    design: resolveDesign(program.design),
    earningMode: program.earning_mode === "amount" ? "amount" : "manual",
    minPurchaseAmount: program.min_purchase_amount ?? null,
    amountPerPoint: program.amount_per_point ?? null,
  };

  return (
    <div>
      <Link href={`/dashboard/programs/${params.id}`} className="text-sm text-[#A6A099] hover:text-gold-bright transition-colors">
        ← {program.title}
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mt-3 mb-1">Programm bearbeiten</h1>
      <p className="text-[#A6A099] text-sm mb-6">Änderungen wirken sich auf alle bereits ausgegebenen Karten aus.</p>
      <ProgramWizard mode="edit" programId={params.id} initial={initial} />
    </div>
  );
}
