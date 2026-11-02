import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import PublicWalletCard from "@/components/PublicWalletCard";
import SubmitButton from "@/components/SubmitButton";
import Logo from "@/components/ui/Logo";
import { isGoogleWalletPublished } from "@/lib/google-wallet";
import { isAppleWalletConfigured } from "@/lib/apple-wallet";
import { claimCardBySerial } from "@/app/konto/actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Deine Treuekarte", robots: { index: false, follow: false } };

export default async function PublicCard({ params, searchParams }: { params: { serial: string }; searchParams: { fehler?: string } }) {
  // Service-Role: liest genau EINE Karte per (nicht erratbarer) Seriennummer.
  // Besitz des Links = Zugriff auf diese eine Karte, wie bei einer
  // physischen Karte; es werden keine weiteren Kundendaten angezeigt.
  const admin = createAdminClient();
  const { data: card } = await admin
    .from("cards")
    .select("*, loyalty_programs(*), organizations(name), customers(user_id)")
    .eq("serial_number", params.serial)
    .maybeSingle();

  if (!card) notFound();

  const p = (card as any).loyalty_programs;
  const ownerId: string | null = (card as any).customers?.user_id ?? null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const qr = await QRCode.toDataURL(`${appUrl}/c/${params.serial}`, {
    margin: 1,
    width: 160,
    color: { dark: "#111111", light: "#ffffff" },
  });

  const googleWalletActive = isGoogleWalletPublished();
  const appleWalletActive = isAppleWalletConfigured();
  const {
    data: { user },
  } = await createClient().auth.getUser();

  return (
    <main id="inhalt" className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper p-6">
      <Logo />
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

      <div className="flex w-[340px] max-w-full flex-col gap-3">
        {searchParams.fehler && (
          <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
            {searchParams.fehler}
          </p>
        )}

        {/* Konto-Verknüpfung */}
        {user && ownerId === user.id ? (
          <Link href={`/konto/karten/${(card as any).id}`} className="btn btn-primary w-full">
            In meinem Wallet öffnen
          </Link>
        ) : user && !ownerId ? (
          <form action={claimCardBySerial.bind(null, params.serial)}>
            <SubmitButton className="btn btn-primary w-full" pendingText="Wird verknüpft …">
              Mit meinem Konto verknüpfen
            </SubmitButton>
          </form>
        ) : !user ? (
          <Link href={`/login?next=${encodeURIComponent(`/c/${params.serial}`)}`} className="btn btn-primary w-full">
            Karte in einem Konto speichern
          </Link>
        ) : (
          <p className="text-center text-sm text-muted">Diese Karte ist mit einem anderen Konto verknüpft.</p>
        )}

        {appleWalletActive ? (
          <a
            href={`/api/wallet/apple?serial=${params.serial}`}
            className="btn w-full flex-col gap-1"
            style={{ background: "#000", color: "#fff", border: "1px solid #333" }}
          >
            <span>Zu Apple Wallet hinzufügen</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="btn w-full flex-col gap-1 disabled:cursor-not-allowed"
            style={{ background: "#000", color: "#fff", border: "1px solid #333", opacity: 0.6 }}
          >
            <span>Zu Apple Wallet hinzufügen</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide">In Vorbereitung</span>
          </button>
        )}
        {googleWalletActive ? (
          <a href={`/api/wallet/google?serial=${params.serial}`} className="btn w-full flex-col gap-1" style={{ background: "#fff", color: "#111", border: "1px solid #ddd" }}>
            <span>Zu Google Wallet hinzufügen</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="btn w-full flex-col gap-1 disabled:cursor-not-allowed"
            style={{ background: "#fff", color: "#111", border: "1px solid #ddd", opacity: 0.6 }}
          >
            <span>Zu Google Wallet hinzufügen</span>
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">In Vorbereitung</span>
          </button>
        )}
        <p className="text-center text-xs text-faint">Zeig diese Karte an der Kasse · Stempel gelten nur bei {(card as any).organizations?.name ?? "diesem Geschäft"}</p>
      </div>
    </main>
  );
}
