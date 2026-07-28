import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { getCurrentOrg } from "@/lib/org";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { org } = await getCurrentOrg();

  return (
    <div className="min-h-screen md:grid" style={{ gridTemplateColumns: "236px 1fr" }}>
      <aside className="border-r p-4 flex flex-col gap-1"
             style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0E0E16" }}>
        <div className="flex items-center gap-3 px-2 pt-2 pb-4">
          <div className="w-8 h-8 rounded-lg grid place-items-center font-extrabold text-white"
               style={{ background: "linear-gradient(140deg,#9D7BFF,#635BFF)" }}>M</div>
          <div>
            <div className="font-bold text-sm">Matei Loyalty</div>
            <div className="text-xs text-neutral-500">{org?.name ?? "Kein Betrieb"}</div>
          </div>
        </div>
        <NavLink href="/dashboard" label="Übersicht" />
        <NavLink href="/dashboard/programs" label="Programme" />
        <NavLink href="/dashboard/customers" label="Kunden" />
        <div className="mt-auto pt-3">
          <form action={signOut}>
            <button className="btn btn-ghost w-full text-sm">Abmelden</button>
          </form>
        </div>
      </aside>
      <main className="p-6 md:p-8 max-w-6xl">{children}</main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}
          className="px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-[#14141E] transition-colors">
      {label}
    </Link>
  );
}
