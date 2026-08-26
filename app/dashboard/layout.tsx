import { signOut } from "@/app/login/actions";
import { getCurrentOrg } from "@/lib/org";
import { getCurrentAdmin } from "@/lib/admin";
import { computeBillingInfo } from "@/lib/billing/access";
import Sidebar from "@/components/dashboard/Sidebar";
import BillingBanner from "@/components/billing/BillingBanner";
import SuspendedBanner from "@/components/dashboard/SuspendedBanner";
import FadeIn from "@/components/dashboard/FadeIn";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { org, role } = await getCurrentOrg();
  const billing = org ? computeBillingInfo(org) : null;
  const { admin } = await getCurrentAdmin();

  return (
    <div className="min-h-screen md:grid" style={{ gridTemplateColumns: "236px 1fr" }}>
      <Sidebar orgName={org?.name ?? null} role={role} signOutAction={signOut} isPlatformAdmin={Boolean(admin)} />
      <main className="p-5 md:p-8 max-w-6xl w-full">
        {org?.admin_suspended ? (
          <SuspendedBanner reason={org.admin_suspended_reason} />
        ) : (
          billing && <BillingBanner billing={billing} />
        )}
        <FadeIn>{children}</FadeIn>
      </main>
    </div>
  );
}
