import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/admin";
import { signOut } from "@/app/login/actions";
import AdminSidebar from "@/components/admin/AdminSidebar";
import FadeIn from "@/components/dashboard/FadeIn";

export const dynamic = "force-dynamic";

// Ein einziges Gate für das gesamte Admin-Panel, analog zu
// app/dashboard/layout.tsx + lib/org.ts requireOrgRole() auf der
// Betriebsseite. Kein Betrieb, keine Mitgliedschaft, kein Umweg über
// RLS-Policies anderer Tabellen - siehe lib/admin.ts.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const result = await requirePlatformAdmin();
  if (!result.ok) redirect("/dashboard");

  return (
    <div className="min-h-screen md:grid" style={{ gridTemplateColumns: "236px 1fr" }}>
      <AdminSidebar role={result.admin.role} signOutAction={signOut} />
      <main className="p-5 md:p-8 max-w-7xl w-full">
        <FadeIn>{children}</FadeIn>
      </main>
    </div>
  );
}
