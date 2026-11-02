import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/admin";
import { signOut } from "@/app/login/actions";
import { KontoHeader, KontoTabBar } from "@/components/konto/KontoNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Mein Konto", template: "%s · Mein Konto" }, robots: { index: false } };

export default async function KontoLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/konto");

  const [{ count }, { admin }] = await Promise.all([
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    getCurrentAdmin(),
  ]);

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-0">
      <KontoHeader email={user.email ?? ""} isBusiness={(count ?? 0) > 0} isAdmin={Boolean(admin)} signOutAction={signOut} />
      <main id="inhalt" className="mx-auto w-full max-w-page px-4 py-6 sm:px-6 md:px-8 md:py-10">
        {children}
      </main>
      <KontoTabBar />
    </div>
  );
}
