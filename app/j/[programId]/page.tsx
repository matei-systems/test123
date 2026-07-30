import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDesign, cardBaseStyle, cardTextColor } from "@/lib/card-design";
import JoinForm from "@/components/join/JoinForm";

export const dynamic = "force-dynamic";

export default async function JoinProgramPage({ params }: { params: { programId: string } }) {
  const admin = createAdminClient();
  const { data: program } = await admin
    .from("loyalty_programs")
    .select("id, title, name, type, stamps_required, points_per_reward, reward_description, design, active, organizations(name)")
    .eq("id", params.programId)
    .maybeSingle();

  if (!program || !program.active) notFound();

  const p = program as any;
  const design = resolveDesign(p.design);
  const title = p.title ?? p.organizations?.name ?? "Treuekarte";
  const goal = p.type === "stamp" ? `${p.stamps_required} Stempel` : `${p.points_per_reward} Punkte`;

  return (
    <main className="min-h-screen bg-ink text-[#F4F1EC] flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-40"
        style={{ background: "radial-gradient(closest-side, rgba(232,181,115,0.14), transparent 70%)" }}
      />
      <div className="w-full max-w-sm relative">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div
            className="w-14 h-14 rounded-2xl grid place-items-center font-extrabold text-lg shrink-0 overflow-hidden"
            style={{ ...cardBaseStyle(design), color: cardTextColor(design) }}
          >
            {design.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={design.logoImage} alt="" className="w-full h-full object-cover" />
            ) : (
              design.logo
            )}
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-[11px] font-bold tracking-[2.5px] uppercase text-gold mb-2">Digitale Treuekarte</div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">{title}</h1>
          <p className="text-dim text-sm">
            {goal} → {p.reward_description}
          </p>
        </div>

        <JoinForm programId={p.id} />

        <p className="text-center text-xs text-faint mt-6">
          Keine App nötig · deine Daten bleiben bei {p.organizations?.name ?? "diesem Betrieb"}
        </p>
      </div>
    </main>
  );
}
