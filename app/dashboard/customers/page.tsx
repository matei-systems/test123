import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import CustomerList from "@/components/customers/CustomerList";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { org } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  const supabase = createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*, cards(id, stamps, points, status, loyalty_programs(id, title, name, type, stamps_required, points_per_reward))")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Kunden</h1>
      <p className="text-[#A6A099] text-sm mb-6">Alle Endkunden deines Betriebs</p>
      <CustomerList customers={(customers as any) ?? []} />
    </div>
  );
}
