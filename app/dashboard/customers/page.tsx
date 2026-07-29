import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { org } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  const supabase = createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Kunden</h1>
      <p className="text-[#A6A099] text-sm mb-6">Alle Endkunden deines Betriebs</p>
      <div className="card overflow-hidden overflow-x-auto enter">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#6E685F] text-xs uppercase">
              <th className="p-3">Name</th>
              <th className="p-3">E-Mail</th>
              <th className="p-3">Seit</th>
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((c: any) => (
              <tr key={c.id} className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                <td className="p-3 font-medium">{c.full_name ?? "—"}</td>
                <td className="p-3 text-[#A6A099]">{c.email ?? "—"}</td>
                <td className="p-3 text-[#A6A099]">
                  {new Date(c.created_at).toLocaleDateString("de-AT")}
                </td>
              </tr>
            ))}
            {(!customers || customers.length === 0) && (
              <tr><td className="p-3 text-[#6E685F]" colSpan={3}>Noch keine Kunden.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
