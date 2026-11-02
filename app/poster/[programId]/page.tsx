import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDesign, cardBaseStyle, cardTextColor } from "@/lib/card-design";
import { earningRuleText } from "@/lib/programs";
import PrintButton from "@/components/join/PrintButton";
import { LogoMark } from "@/components/ui/Logo";
import { TextStamp } from "@/components/site/Illustrations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tresen-Aufsteller", robots: { index: false } };

// Druckvorlage nach dem Canva-Entwurf "Tresen-Aufsteller (A5)": Papierton,
// großer QR-Code zum Beitritt, Text-Stempel, drei Schritte. Farben bewusst
// fest (nicht vom Hell/Dunkel-Schema abhängig), damit der Druck immer gleich
// aussieht. Kopfzeile in der Kartenfarbe des Geschäfts.
export default async function PosterPage({ params }: { params: { programId: string } }) {
  const admin = createAdminClient();
  const { data: program } = await admin
    .from("loyalty_programs")
    .select("id, title, name, type, design, reward_description, stamps_required, points_per_reward, earning_mode, min_purchase_amount, amount_per_point, organizations(name)")
    .eq("id", params.programId)
    .maybeSingle();

  if (!program) notFound();

  const p = program as any;
  const design = resolveDesign(p.design);
  const orgName = p.organizations?.name ?? p.title ?? "Unser Geschäft";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const joinUrl = `${appUrl}/j/${p.id}`;
  const qr = await QRCode.toDataURL(joinUrl, { margin: 1, width: 640, errorCorrectionLevel: "M", color: { dark: "#14110F", light: "#ffffff" } });
  const what = p.type === "stamp" ? "Treuestempel" : "Treuepunkte";
  const goal = p.type === "stamp" ? `${p.stamps_required} Stempel` : `${p.points_per_reward} Punkte`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#E9E1D4] p-6 print:bg-white print:p-0">
      <style>{`@page { size: A5 portrait; margin: 0; } @media print { html, body { background: #fff !important; } }`}</style>
      <article
        className="relative flex w-full max-w-[148mm] flex-col overflow-hidden rounded-[18px] bg-[#FAF6EF] text-[#14110F] shadow-[0_30px_60px_-30px_rgba(60,40,20,0.45)] print:h-[210mm] print:max-w-none print:rounded-none print:shadow-none"
        style={{ aspectRatio: "148 / 210" }}
      >
        <header className="flex items-center gap-3 px-[9mm] py-[5mm]" style={{ ...cardBaseStyle(design), color: cardTextColor(design) }}>
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white/20 text-sm font-extrabold">
            {design.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={design.logoImage} alt="" className="h-full w-full object-cover" />
            ) : (
              design.logo
            )}
          </span>
          <span className="min-w-0 truncate text-[15px] font-semibold">{orgName}</span>
        </header>

        <div className="flex flex-1 flex-col px-[9mm] pb-[7mm] pt-[6mm]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A5A1F]">Digitale Treuekarte</p>
          <h1 className="mt-2 font-display text-[30px] font-semibold leading-[1.05]">
            Sammle bei uns <span className="italic text-[#9C5A18]">{what}</span>
          </h1>
          <p className="mt-2 text-[12.5px] leading-snug text-[#574E45]">
            {earningRuleText(p)} · {goal}
            {p.reward_description ? ` = ${p.reward_description}` : ""}
          </p>

          <div className="relative mx-auto mt-[6mm] w-[62%]">
            <div className="rounded-[16px] border-2 border-dashed border-[#C07A2C] bg-white p-[3mm]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR-Code: Treuekarte holen" className="block w-full" />
            </div>
            <div className="absolute -right-[13mm] -top-[9mm] rotate-[8deg]">
              <TextStamp size={92} spin={false} />
            </div>
          </div>
          <p className="mt-[3mm] text-center text-[11px] font-semibold text-[#574E45]">Mit der Handykamera scannen</p>

          <ol className="mt-[6mm] grid grid-cols-3 gap-[3mm] text-center">
            {[
              ["Scannen", "QR-Code mit der Kamera öffnen"],
              ["Sammeln", "Karte bei jedem Einkauf zeigen"],
              ["Belohnung genießen", "Einlösen direkt hier an der Kasse"],
            ].map(([t, d], i) => (
              <li key={t} className="flex flex-col items-center gap-1">
                <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-dashed border-[#C07A2C] font-display text-[15px] font-semibold text-[#8A5A1F]">
                  {i + 1}
                </span>
                <span className="text-[11.5px] font-semibold leading-tight">{t}</span>
                <span className="text-[9.5px] leading-snug text-[#574E45]">{d}</span>
              </li>
            ))}
          </ol>

          <div className="mt-auto flex items-end justify-between gap-3 pt-[5mm]">
            <p className="max-w-[70%] text-[9.5px] leading-snug text-[#736A5F]">
              Keine App nötig – die Karte öffnet sich im Browser. Stempel und Punkte gelten nur bei {orgName}.
            </p>
            <span className="flex items-center gap-1.5">
              <LogoMark size={20} />
              <span className="font-display text-[13px] font-semibold">matei</span>
            </span>
          </div>
        </div>
      </article>
      <div className="print:hidden">
        <PrintButton />
      </div>
    </main>
  );
}
