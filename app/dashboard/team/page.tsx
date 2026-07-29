import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL } from "@/lib/permissions";
import InviteForm from "@/components/team/InviteForm";
import MembersTable from "@/components/team/MembersTable";
import InvitationsList from "@/components/team/InvitationsList";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { org, role, user } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  const supabase = createClient();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, role, location_id, created_at, user_id, profiles(email, full_name)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: true });

  const { data: locations } = await supabase.from("locations").select("id, name").eq("org_id", org.id).order("name");

  const isAdmin = role === "admin" || role === "owner";
  let invitations: any[] = [];
  if (isAdmin) {
    const { data } = await supabase
      .from("invitations")
      .select("id, email, role, status, created_at, expires_at, token")
      .eq("org_id", org.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    invitations = data ?? [];
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Team</h1>
        <p className="text-[#A6A099] text-sm">
          Deine Rolle: <span className="text-gold-bright font-medium">{ROLE_LABEL[role ?? "staff"]}</span>
        </p>
      </div>

      {isAdmin && (
        <div className="card p-5 mb-6 enter">
          <div className="font-semibold text-sm text-[#F4F1EC] mb-3">Mitarbeiter einladen</div>
          <InviteForm canInviteAdmin={role === "owner"} />
        </div>
      )}

      {isAdmin && invitations.length > 0 && (
        <div className="mb-6 enter" style={{ animationDelay: "40ms" }}>
          <div className="font-semibold text-sm text-[#F4F1EC] mb-3">Offene Einladungen ({invitations.length})</div>
          <InvitationsList invitations={invitations} />
        </div>
      )}

      <div className="enter" style={{ animationDelay: "80ms" }}>
        <div className="font-semibold text-sm text-[#F4F1EC] mb-3">Mitglieder ({memberships?.length ?? 0})</div>
        <MembersTable
          members={(memberships ?? []) as any}
          locations={locations ?? []}
          currentUserId={user!.id}
          currentUserRole={role ?? "staff"}
        />
      </div>
    </div>
  );
}
