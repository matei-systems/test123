import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { hasMinRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { computeBillingInfo } from "@/lib/billing/access";
import ProfileForm from "@/components/dashboard/ProfileForm";
import SubmitButton from "@/components/SubmitButton";
import { fmtDate } from "@/lib/programs";
import { setListed, withdrawSubmission } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Geschäftsprofil" };

const STATUS: Record<string, { label: string; badge: string }> = {
  draft: { label: "Entwurf", badge: "badge-muted" },
  pending: { label: "In Prüfung", badge: "badge-warn" },
  approved: { label: "Freigeschaltet", badge: "badge-forest" },
  rejected: { label: "Abgelehnt", badge: "badge-danger" },
  paused: { label: "Pausiert", badge: "badge-danger" },
};

export default async function ProfilPage({ searchParams }: { searchParams: { ok?: string; fehler?: string } }) {
  const { org, role } = await getCurrentOrg();
  if (!org) redirect("/dashboard/onboarding");
  const canEdit = hasMinRole(role, "admin");

  const supabase = createClient();
  const [{ data: profile, error }, { data: reviews }] = await Promise.all([
    supabase.from("business_profiles").select("*").eq("org_id", org.id).maybeSingle(),
    supabase.from("business_reviews").select("decision, note, created_at").eq("org_id", org.id).order("created_at", { ascending: false }).limit(1),
  ]);

  if (!profile) {
    return (
      <div className="card p-8">
        <h1 className="font-display text-2xl font-semibold">Geschäftsprofil</h1>
        <p className="mt-2 text-muted">
          {error ? "Das Profil konnte gerade nicht geladen werden. Bitte lade die Seite neu." : "Für deinen Betrieb wurde noch kein Profil angelegt."}
        </p>
      </div>
    );
  }

  const st = STATUS[profile.listing_status] ?? STATUS.draft;
  const lastReview = reviews?.[0];
  const billingActive = computeBillingInfo(org).state === "active" && !org.admin_suspended;
  const publicNow = profile.listing_status === "approved" && profile.is_listed && billingActive;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-semibold leading-tight">Geschäftsprofil</h1>
          <p className="mt-1 text-sm text-muted">So erscheint dein Geschäft im Verzeichnis und auf deiner öffentlichen Profilseite.</p>
        </div>
        {publicNow && (
          <Link href={`/geschaefte/${profile.slug}`} target="_blank" className="btn btn-ghost btn-sm">
            Öffentliches Profil ansehen ↗
          </Link>
        )}
      </div>

      {searchParams.ok && <p role="status" className="rounded-xl bg-forest/10 px-4 py-3 text-sm font-medium text-forest">{searchParams.ok}</p>}
      {searchParams.fehler && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{searchParams.fehler}</p>}

      <section className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between" aria-label="Prüfstatus">
        <div>
          <div className="flex items-center gap-3">
            <span className={`badge ${st.badge}`}>{st.label}</span>
            {profile.listing_status === "approved" && (
              <span className={`badge ${publicNow ? "badge-forest" : "badge-muted"}`}>{publicNow ? "Im Verzeichnis sichtbar" : "Nicht sichtbar"}</span>
            )}
          </div>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            {profile.listing_status === "draft" &&
              "Dein Profil ist noch nicht öffentlich. Fülle Name, Kategorie, Ort und Beschreibung aus und reiche es zur Prüfung ein."}
            {profile.listing_status === "pending" &&
              `Eingereicht am ${fmtDate(profile.submitted_at)}. Wir prüfen dein Profil und schalten es danach frei. Du kannst es währenddessen weiter bearbeiten.`}
            {profile.listing_status === "approved" &&
              (publicNow
                ? `Freigeschaltet seit ${fmtDate(profile.approved_at)}. Kundinnen und Kunden finden dich unter „Geschäfte entdecken“.`
                : !profile.is_listed
                  ? "Freigeschaltet, aber von dir im Verzeichnis ausgeblendet."
                  : "Freigeschaltet, aber derzeit nicht sichtbar, weil die Testphase abgelaufen bzw. das Abo nicht aktiv ist.")}
            {profile.listing_status === "rejected" &&
              `Die Prüfung war nicht erfolgreich${lastReview?.note ? `: „${lastReview.note}“` : "."} Passe das Profil an und reiche es erneut ein.`}
            {profile.listing_status === "paused" &&
              `Dein Profil wurde von Matei Systems pausiert${lastReview?.note ? `: „${lastReview.note}“` : "."} Bitte wende dich an den Support.`}
          </p>
        </div>
        {canEdit && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {profile.listing_status === "pending" && (
              <form action={withdrawSubmission}>
                <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">Einreichung zurückziehen</SubmitButton>
              </form>
            )}
            {profile.listing_status === "approved" && (
              <form action={setListed.bind(null, !profile.is_listed)}>
                <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">
                  {profile.is_listed ? "Im Verzeichnis ausblenden" : "Im Verzeichnis anzeigen"}
                </SubmitButton>
              </form>
            )}
            {profile.listing_status === "paused" && (
              <Link href="/dashboard/support" className="btn btn-ghost btn-sm">
                Support kontaktieren
              </Link>
            )}
          </div>
        )}
      </section>

      <ProfileForm
        canEdit={canEdit}
        canSubmit={["draft", "rejected"].includes(profile.listing_status)}
        initial={{
          display_name: profile.display_name,
          tagline: profile.tagline,
          description: profile.description,
          category: profile.category,
          logo_url: profile.logo_url,
          address: profile.address,
          postal_code: profile.postal_code,
          city: profile.city,
          phone: profile.phone,
          website: profile.website,
          public_email: profile.public_email,
          instagram: profile.instagram,
          opening_hours: profile.opening_hours,
          hours_note: profile.hours_note,
        }}
      />
    </div>
  );
}
