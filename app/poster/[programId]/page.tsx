import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDesign, cardBaseStyle, cardTextColor } from "@/lib/card-design";
import PrintButton from "@/components/join/PrintButton";

export const dynamic = "force-dynamic";

export default async function PosterPage({ params }: { params: { programId: string } }) {
  const admin = createAdminClient();
  const { data: program } = await admin
    .from("loyalty_programs")
    .select("id, title, name, design, reward_description, organizations(name)")
    .eq("id", params.programId)
    .maybeSingle();

  if (!program) notFound();

  const p = program as any;
  const design = resolveDesign(p.design);
  const bgStyle = cardBaseStyle(design);
  const textColor = cardTextColor(design);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const joinUrl = `${appUrl}/j/${p.id}`;
  const qr = await QRCode.toDataURL(joinUrl, { margin: 1, width: 480, color: { dark: "#111111", light: "#ffffff" } });

  return (
    <main className="min-h-screen bg-ink text-[#F4F1EC] flex items-center justify-center p-6 print:bg-white print:text-black print:p-0">
      <div className="w-full max-w-[480px] print:max-w-none">
        <div
          className="relative rounded-3xl p-10 text-center print:rounded-none print:p-16 overflow-hidden"
          style={{ ...bgStyle, color: textColor }}
        >
          <div className="relative">
            <div className="text-xs uppercase tracking-[3px] opacity-80 mb-3">Digitale Treuekarte</div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">{p.title ?? p.organizations?.name}</h1>
            <div className="text-sm opacity-90 mb-8">Belohnung: {p.reward_description}</div>

            <div className="bg-white rounded-2xl p-5 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR-Code zum Anmelden" className="w-full max-w-[280px]" />
            </div>

            <div className="mt-8 text-lg font-bold">Jetzt scannen &amp; Treuekarte sichern</div>
            <div className="mt-2 text-sm opacity-85">Kein Download, keine App — in Sekunden im Handy.</div>
          </div>
        </div>

        <PrintButton />
      </div>
    </main>
  );
}
