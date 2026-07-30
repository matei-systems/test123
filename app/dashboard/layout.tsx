import { signOut } from "@/app/login/actions";
import { getCurrentOrg } from "@/lib/org";
import { computeBillingInfo } from "@/lib/billing/access";
import Sidebar from "@/components/dashboard/Sidebar";
import BillingBanner from "@/components/billing/BillingBanner";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { org, role } = await getCurrentOrg();
  const billing = org ? computeBillingInfo(org) : null;

  return (
    <div className="min-h-screen md:grid" style={{ gridTemplateColumns: "236px 1fr" }}>
      <Sidebar orgName={org?.name ?? null} role={role} signOutAction={signOut} />
      <main className="p-5 md:p-8 max-w-6xl w-full">
        {billing && <BillingBanner billing={billing} />}
        {children}
      </main>
    </div>
  );
}
