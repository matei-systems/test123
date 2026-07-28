import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { createProgram } from "./actions";
import { THEMES, themeGradient } from "@/lib/themes";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const { org } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  const supabase = createClient();
  const { data: programs } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Programme</h1>
      <p className="text-neutral-400 text-sm mb-6">Deine digitalen Treuekarten</p>

      {/* Neues Programm */}
      <form action={createProgram} className="card p-6 mb-8 space-y-4">
        <div className="font-semibold text-sm text-neutral-300">Neues Programm</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Programmname (intern)</label>
            <input className="input" name="name" required placeholder="Kaffee-Treuekarte" />
          </div>
          <div>
            <label className="label">Anzeigename auf der Karte</label>
            <input className="input" name="title" required placeholder="Café Central" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Typ</label>
            <select className="input" name="type" defaultValue="stamp">
              <option value="stamp">Stempelkarte</option>
              <option value="points">Punktekarte</option>
            </select>
          </div>
          <div>
            <label className="label">Stempel bis Belohnung</label>
            <input className="input" type="number" name="stamps_required" defaultValue={10} min={3} max={20} />
          </div>
          <div>
            <label className="label">Punkte bis Belohnung</label>
            <input className="input" type="number" name="points_per_reward" defaultValue={100} min={10} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Belohnung</label>
            <input className="input" name="reward_description" required placeholder="1 Gratis-Kaffee" />
          </div>
          <div>
            <label className="label">Logo-Buchstabe</label>
            <input className="input" name="logo" maxLength={2} defaultValue="C" />
          </div>
        </div>

        <div>
          <label className="label">Kartenfarbe</label>
          <div className="flex gap-3 flex-wrap">
            {THEMES.map((t, i) => (
              <label key={i} className="cursor-pointer">
                <input type="radio" name="theme" value={i} defaultChecked={i === 0} className="peer sr-only" />
                <span className="block w-9 h-9 rounded-lg peer-checked:ring-2 peer-checked:ring-white"
                      style={{ background: themeGradient(i) }} title={t.name} />
              </label>
            ))}
          </div>
        </div>

        <button className="btn btn-primary">Programm speichern</button>
      </form>

      {/* Liste */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
        {(programs ?? []).map((p: any) => (
          <Link key={p.id} href={`/dashboard/programs/${p.id}`}
                className="card p-4 hover:border-white/20 transition-colors block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg grid place-items-center font-extrabold text-white"
                   style={{ background: themeGradient(p.design?.theme ?? 0) }}>
                {p.design?.logo ?? "C"}
              </div>
              <div>
                <div className="font-semibold text-sm">{p.title}</div>
                <div className="text-xs text-neutral-400">
                  {p.name} · {p.type === "stamp" ? "Stempelkarte" : "Punktekarte"}
                </div>
              </div>
            </div>
            <div className="text-xs text-neutral-400 mt-3">Belohnung: {p.reward_description}</div>
          </Link>
        ))}
        {(!programs || programs.length === 0) && (
          <div className="text-neutral-500 text-sm">Noch keine Programme. Leg oben dein erstes an.</div>
        )}
      </div>
    </div>
  );
}
