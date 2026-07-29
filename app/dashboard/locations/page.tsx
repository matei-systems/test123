import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { hasMinRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import LocationManager from "@/components/locations/LocationManager";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const { org, role } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");
  if (!hasMinRole(role, "admin")) redirect("/dashboard");

  const supabase = createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, address, city, postal_code")
    .eq("org_id", org.id)
    .order("name");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Standorte</h1>
        <p className="text-[#A6A099] text-sm">
          Filialen deines Betriebs. Ordne Mitarbeiter im Team-Bereich einem Standort zu — ihre Stempel/Einlösungen
          werden dann automatisch damit getaggt.
        </p>
      </div>
      <LocationManager locations={locations ?? []} />
    </div>
  );
}
