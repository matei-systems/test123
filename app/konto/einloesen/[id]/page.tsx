import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { getWalletCard } from "@/lib/konto";
import { costText } from "@/lib/programs";
import RedeemCodeLive from "@/components/konto/RedeemCodeLive";
import SubmitButton from "@/components/SubmitButton";
import { requestRedemptionCode } from "@/app/konto/actions";

export const metadata = { title: "Einlöse-Code" };

export default async function EinloesenPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // rr_owner_select: nur eigene Codes sichtbar
  const { data: req } = await supabase
    .from("redemption_requests")
    .select("id, token, short_code, status, expires_at, card_id, reward_id, rewards(title, cost_points)")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .maybeSingle();
  if (!req) notFound();

  const card = await getWalletCard(supabase, user!.id, req.card_id);
  if (!card) notFound();

  const reward = (req as any).rewards as { title: string; cost_points: number } | null;
  const qrSvg = await QRCode.toString(req.token, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#14110F", light: "#FFFFFF" } });
  const status = req.status === "pending" && new Date(req.expires_at).getTime() < Date.now() ? "expired" : req.status;

  return (
    <div className="enter mx-auto max-w-md">
      <RedeemCodeLive
        requestId={req.id}
        cardId={req.card_id}
        qrSvg={qrSvg}
        shortCode={req.short_code}
        expiresAt={req.expires_at}
        rewardTitle={reward?.title ?? "Belohnung"}
        costLabel={reward ? costText(card.program?.type ?? "stamp", reward.cost_points) : ""}
        businessName={card.business?.display_name ?? "Geschäft"}
        initialStatus={status}
        newCodeForm={
          <form action={requestRedemptionCode.bind(null, req.card_id, req.reward_id)}>
            <SubmitButton className="btn btn-forest" pendingText="Wird erstellt …">
              Neuen Code anzeigen
            </SubmitButton>
          </form>
        }
      />
    </div>
  );
}
