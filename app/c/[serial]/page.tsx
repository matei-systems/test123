import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import WalletCard from "@/components/WalletCard";

export const dynamic = "force-dynamic";

export default async function PublicCard({ params }: { params: { serial: string } }) {
  // Service-Role: liest genau EINE Karte per Serial (RLS-neutral, serverseitig).
  const admin = createAdminClient();
  const { data: card } = await admin
    .from("cards")
    .select("*, loyalty_programs(*), organizations(name)")
    .eq("serial_number", params.serial)
    .maybeSingle();

  if (!card) notFound();

  const p = (card as any).loyalty_programs;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const qr = await QRCode.toDataURL(`${appUrl}/c/${params.serial}`, {
    margin: 1,
    width: 160,
    color: { dark: "#111111", light: "#ffffff" },
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <WalletCard
        title={p.title ?? (card as any).organizations?.name ?? "Treuekarte"}
        logo={p.design?.logo ?? "C"}
        theme={p.design?.theme ?? 0}
        type={p.type}
        stamps={(card as any).stamps}
        stampsRequired={p.stamps_required}
        points={(card as any).points}
        pointsPerReward={p.points_per_reward}
        reward={p.reward_description ?? ""}
        serial={(card as any).serial_number}
        qrDataUrl={qr}
      />
      <div className="flex flex-col gap-3 w-[340px] max-w-full">
        <a href={`/api/wallet/apple?serial=${params.serial}`}
           className="btn w-full" style={{ background: "#000", color: "#fff", border: "1px solid #333" }}>
           Zu Apple Wallet hinzufügen
        </a>
        <a href={`/api/wallet/google?serial=${params.serial}`}
           className="btn w-full" style={{ background: "#fff", color: "#111" }}>
           Zu Google Wallet hinzufügen
        </a>
        <p className="text-xs text-neutral-500 text-center">
          Karte scannen zum Sammeln · matei.systems
        </p>
      </div>
    </main>
  );
}
