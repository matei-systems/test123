import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { hasMinRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { resolveDesign, cardBackground, cardTextColor } from "@/lib/card-design";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const { org, role } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");
  const canManage = hasMinRole(role, "admin");

  const supabase = createClient();
  const { data: programs } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Programme</h1>
          <p className="text-[#A6A099] text-sm">Deine digitalen Treuekarten</p>
        </div>
        {canManage && (
          <Link href="/dashboard/programs/new" className="btn btn-primary text-sm shrink-0">
            + Neues Programm
          </Link>
        )}
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
        {(programs ?? []).map((p: any, i: number) => {
          const d = resolveDesign(p.design);
          return (
          <div key={p.id} className="card card-hover p-4 enter relative group" style={{ animationDelay: `${i * 50}ms` }}>
            <Link href={`/dashboard/programs/${p.id}`} className="block">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg grid place-items-center font-extrabold shrink-0 overflow-hidden"
                  style={{ ...cardBackground(d).style, color: cardTextColor(d) }}
                >
                  {d.logoImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.logoImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    d.logo
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{p.title}</div>
                  <div className="text-xs text-[#A6A099] truncate">
                    {p.name} · {p.type === "stamp" ? "Stempelkarte" : "Punktekarte"}
                  </div>
                </div>
              </div>
              <div className="text-xs text-[#A6A099] mt-3">Belohnung: {p.reward_description}</div>
            </Link>
            {canManage && (
              <Link
                href={`/dashboard/programs/${p.id}/edit`}
                className="absolute top-3 right-3 w-7 h-7 rounded-lg grid place-items-center text-faint hover:text-gold-bright hover:bg-white/[0.06] transition-colors"
                aria-label="Programm bearbeiten"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
                </svg>
              </Link>
            )}
          </div>
          );
        })}
        {(!programs || programs.length === 0) && (
          <div className="text-[#6E685F] text-sm">Noch keine Programme. Leg dein erstes an.</div>
        )}
      </div>
    </div>
  );
}
