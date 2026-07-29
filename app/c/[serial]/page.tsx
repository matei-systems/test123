import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import PublicWalletCard from "@/components/PublicWalletCard";
import { isGoogleWalletConfigured } from "@/lib/google-wallet";

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

  const googleWalletActive = isGoogleWalletConfigured();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <PublicWalletCard
        title={p.title ?? (card as any).organizations?.name ?? "Treuekarte"}
        design={p.design ?? {}}
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
        <button
          type="button"
          disabled
          className="btn w-full flex-col gap-1 disabled:cursor-not-allowed"
          style={{ background: "#000", color: "#fff", border: "1px solid #333", opacity: 0.6 }}
        >
          <span>Zu Apple Wallet hinzufügen</span>
          <span className="text-[10px] uppercase tracking-wide bg-white/15 px-2 py-0.5 rounded-full">Bald verfügbar</span>
        </button>
        {googleWalletActive ? (
          <a
            href={`/api/wallet/google?serial=${params.serial}`}
            className="btn w-full flex-col gap-1"
            style={{ background: "#fff", color: "#111" }}
          >
            <span>Zu Google Wallet hinzufügen</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="btn w-full flex-col gap-1 disabled:cursor-not-allowed"
            style={{ background: "#fff", color: "#111", opacity: 0.6 }}
          >
            <span>Zu Google Wallet hinzufügen</span>
            <span className="text-[10px] uppercase tracking-wide bg-black/10 px-2 py-0.5 rounded-full">Bald verfügbar</span>
          </button>
        )}
        <p className="text-xs text-faint text-center">
          Karte scannen zum Sammeln · matei.systems
        </p>
      </div>
    </main>
  );
}
