import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import WalletCard from "@/components/WalletCard";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

const TX_LABEL: Record<string, string> = {
  stamp: "Stempel vergeben",
  points: "Punkte vergeben",
  redeem: "Belohnung eingelöst",
  adjust: "Anpassung",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  completed: "Voll",
  redeemed: "Eingelöst",
  inactive: "Inaktiv",
};

export default async function CustomerProfile({ params }: { params: { id: string } }) {
  const { org } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");

  const supabase = createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", params.id)
    .eq("org_id", org.id)
    .single();
  if (!customer) notFound();

  const { data: cards } = await supabase
    .from("cards")
    .select("*, loyalty_programs(*)")
    .eq("customer_id", params.id)
    .order("created_at", { ascending: false });

  const cardIds = (cards ?? []).map((c: any) => c.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const cardsWithQr = await Promise.all(
    (cards ?? []).map(async (c: any) => ({
      ...c,
      qr: await QRCode.toDataURL(`${appUrl}/c/${c.serial_number}`, {
        margin: 1,
        width: 120,
        color: { dark: "#111111", light: "#ffffff" },
      }),
    }))
  );

  const [transactionsRes, redemptionsRes] = cardIds.length
    ? await Promise.all([
        supabase
          .from("transactions")
          .select("id, type, amount, created_at, cards(loyalty_programs(title, name))")
          .in("card_id", cardIds)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("reward_redemptions")
          .select("id, redeemed_at, cards(loyalty_programs(title, name, reward_description))")
          .in("card_id", cardIds)
          .order("redeemed_at", { ascending: false })
          .limit(15),
      ])
    : [{ data: [] }, { data: [] }];

  const transactions = transactionsRes.data ?? [];
  const redemptions = redemptionsRes.data ?? [];

  const initials =
    ((customer.full_name?.trim().split(/\s+/)[0]?.[0] ?? "") + (customer.full_name?.trim().split(/\s+/)[1]?.[0] ?? "")).toUpperCase() ||
    "?";

  return (
    <div>
      <Link href="/dashboard/customers" className="text-sm text-[#A6A099] hover:text-gold-bright transition-colors">
        ← Kunden
      </Link>

      <div className="flex items-center gap-4 mt-3 mb-8 enter">
        <div className="w-14 h-14 rounded-full bg-[rgba(232,181,115,0.14)] text-gold-bright grid place-items-center font-bold text-lg shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{customer.full_name ?? "Kunde"}</h1>
          <div className="text-sm text-[#A6A099] flex flex-wrap gap-x-3">
            {customer.email && <span>{customer.email}</span>}
            {customer.phone && <span>{customer.phone}</span>}
            <span>Kunde seit {new Date(customer.created_at).toLocaleDateString("de-AT")}</span>
          </div>
        </div>
      </div>

      <div className="font-semibold text-sm text-[#F4F1EC] mb-3">Treuekarten ({cardsWithQr.length})</div>
      {cardsWithQr.length === 0 ? (
        <div className="card p-6 text-sm text-[#6E685F] mb-8">Noch keine Karte für diesen Kunden ausgegeben.</div>
      ) : (
        <div className="grid gap-5 mb-8" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
          {cardsWithQr.map((c: any, i: number) => {
            const p = c.loyalty_programs;
            return (
              <div key={c.id} className="enter" style={{ animationDelay: `${i * 60}ms` }}>
                <WalletCard
                  title={p?.title ?? p?.name ?? "Treuekarte"}
                  logo={p?.design?.logo ?? "C"}
                  logoImage={p?.design?.logoImage ?? null}
                  theme={p?.design?.theme ?? 0}
                  type={p?.type ?? "stamp"}
                  stamps={c.stamps}
                  stampsRequired={p?.stamps_required ?? 10}
                  points={c.points}
                  pointsPerReward={p?.points_per_reward ?? 100}
                  reward={p?.reward_description ?? ""}
                  serial={c.serial_number}
                  qrDataUrl={c.qr}
                />
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-xs text-[#A6A099]">
                    Status: <span className="text-[#F4F1EC]">{STATUS_LABEL[c.status] ?? c.status}</span>
                  </span>
                  <span className="text-xs text-faint">Apple/Google Wallet: nicht verbunden</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="font-semibold text-sm text-[#F4F1EC] mb-3">Verlauf</div>
          <div className="card p-4">
            {transactions.length === 0 ? (
              <div className="text-sm text-[#6E685F] py-2">Noch keine Aktivität.</div>
            ) : (
              <div className="space-y-1">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between gap-3 py-2 border-t first:border-t-0 border-white/[0.06]">
                    <div className="text-sm text-[#F4F1EC] min-w-0 truncate">
                      {TX_LABEL[tx.type] ?? tx.type}
                      <span className="text-[#A6A099]"> · {tx.cards?.loyalty_programs?.title ?? tx.cards?.loyalty_programs?.name}</span>
                    </div>
                    <div className="text-xs text-[#A6A099] shrink-0">{timeAgo(tx.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="font-semibold text-sm text-[#F4F1EC] mb-3">Eingelöste Belohnungen</div>
          <div className="card p-4">
            {redemptions.length === 0 ? (
              <div className="text-sm text-[#6E685F] py-2">Noch keine Belohnung eingelöst.</div>
            ) : (
              <div className="space-y-1">
                {redemptions.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-2 border-t first:border-t-0 border-white/[0.06]">
                    <div className="text-sm text-[#F4F1EC] min-w-0 truncate">
                      {r.cards?.loyalty_programs?.reward_description ?? "Belohnung"}
                      <span className="text-[#A6A099]"> · {r.cards?.loyalty_programs?.title ?? r.cards?.loyalty_programs?.name}</span>
                    </div>
                    <div className="text-xs text-[#A6A099] shrink-0">{timeAgo(r.redeemed_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
