import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicShell, { Container } from "@/components/site/PublicShell";
import { BusinessAvatar } from "@/components/site/BusinessCard";
import { categoryLabel, getPublicBusiness, normalizeHours, WEEKDAYS } from "@/lib/directory";
import { campaignText, costText, earningRuleText, fmtDate, instagramUrl, programTypeLabel, safeUrl } from "@/lib/programs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getPublicBusiness(params.slug);
  if (!data) return { title: "Geschäft nicht gefunden" };
  const b = data.business;
  return {
    title: `${b.display_name} – Treuekarte`,
    description: b.tagline || b.description?.slice(0, 160) || `Treuekarte von ${b.display_name} auf Matei Systems.`,
  };
}

export default async function GeschaeftPage({ params }: { params: { slug: string } }) {
  const data = await getPublicBusiness(params.slug);
  if (!data) notFound();
  const { business: b, programs, rewards, campaigns, locations } = data;

  const hours = normalizeHours(b.opening_hours);
  const showHours = hours.some((h) => !h.closed);
  const website = safeUrl(b.website);
  const insta = instagramUrl(b.instagram);
  const addressLine = [b.address, [b.postal_code, b.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const mapUrl = addressLine ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(addressLine)}` : null;

  return (
    <PublicShell>
      <section className="border-b border-line bg-surface/50">
        <Container className="py-8 md:py-12">
          <nav aria-label="Brotkrumen" className="text-sm text-muted">
            <Link href="/geschaefte" className="hover:text-accent">Geschäfte</Link>
            <span aria-hidden="true" className="mx-2 text-faint">/</span>
            <span className="text-fg">{b.display_name}</span>
          </nav>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-5">
              <BusinessAvatar name={b.display_name} logoUrl={b.logo_url} size={84} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted">
                  {categoryLabel(b.category)}
                  {b.city ? ` · ${b.city}` : ""}
                </p>
                <h1 className="mt-1 font-display text-[36px] font-semibold leading-tight sm:text-[48px]">{b.display_name}</h1>
                {b.tagline && <p className="mt-2 max-w-2xl text-[17px] text-muted">{b.tagline}</p>}
              </div>
            </div>
            {programs.length === 1 && (
              <Link href={`/j/${programs[0].id}`} className="btn btn-primary btn-lg shrink-0">
                Karte holen
              </Link>
            )}
          </div>
        </Container>
      </section>

      <Container className="grid gap-10 py-10 md:py-14 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-12">
          {b.description && (
            <section aria-labelledby="ueber">
              <h2 id="ueber" className="font-display text-2xl font-semibold">Über uns</h2>
              <p className="mt-3 whitespace-pre-line text-[16px] leading-relaxed text-muted">{b.description}</p>
            </section>
          )}

          {campaigns.length > 0 && (
            <section aria-labelledby="aktionen">
              <h2 id="aktionen" className="font-display text-2xl font-semibold">Aktuelle Aktionen</h2>
              <ul className="mt-4 space-y-3">
                {campaigns.map((c) => (
                  <li key={c.id} className="card flex gap-4 p-5">
                    <span className="badge badge-accent h-fit">{c.type === "multiplier" ? "Aktion" : "Info"}</span>
                    <div>
                      <h3 className="font-semibold">{c.name}</h3>
                      {c.description && <p className="mt-1 text-[15px] text-muted">{c.description}</p>}
                      {campaignText(c) && <p className="mt-1 text-sm font-medium text-accent">{campaignText(c)}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="programme">
            <h2 id="programme" className="font-display text-2xl font-semibold">Treueprogramm{programs.length > 1 ? "e" : ""} & Belohnungen</h2>
            {programs.length === 0 ? (
              <p className="card mt-4 p-6 text-muted">Dieses Geschäft hat gerade kein aktives Treueprogramm.</p>
            ) : (
              <div className="mt-4 space-y-6">
                {programs.map((p) => {
                  const list = rewards.filter((r) => r.program_id === p.id);
                  return (
                    <article key={p.id} className="card p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <span className={`badge ${p.type === "stamp" ? "badge-forest" : "badge-accent"}`}>{programTypeLabel(p.type)}</span>
                          <h3 className="mt-2 font-display text-xl font-semibold">{p.title || p.name}</h3>
                          <p className="mt-1 text-[15px] text-muted">{earningRuleText(p)}</p>
                        </div>
                        <Link href={`/j/${p.id}`} className="btn btn-primary btn-sm">
                          Karte holen
                        </Link>
                      </div>
                      {list.length > 0 && (
                        <ul className="mt-5 space-y-3">
                          {list.map((r) => (
                            <li key={r.id} className="ticket flex items-stretch overflow-visible">
                              <div className="flex min-w-[92px] flex-col items-center justify-center px-4 py-3 text-center">
                                <span className="font-display text-2xl font-semibold leading-none text-accent tabular">{r.cost_points}</span>
                                <span className="mt-1 text-xs text-muted">{p.type === "stamp" ? "Stempel" : "Punkte"}</span>
                              </div>
                              <div className="ticket-cut flex-1 px-4 py-3">
                                <div className="font-semibold">{r.title}</div>
                                {r.description && <p className="mt-0.5 text-[15px] text-muted">{r.description}</p>}
                                {r.conditions && <p className="mt-1 text-sm text-faint">Bedingung: {r.conditions}</p>}
                                {r.valid_until && <p className="mt-1 text-sm text-faint">Gültig bis {fmtDate(r.valid_until)}</p>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section aria-labelledby="bedingungen" className="card-flat p-6">
            <h2 id="bedingungen" className="font-display text-xl font-semibold">Teilnahmebedingungen</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-muted">
              <li>Stempel und Punkte gelten ausschließlich bei {b.display_name} und sind nicht übertragbar.</li>
              <li>Sie haben keinen Barwert und werden nicht ausgezahlt.</li>
              <li>Es gelten die bei der jeweiligen Belohnung angegebenen Kosten, Bedingungen und Gültigkeiten.</li>
              <li>Einlöse-Codes sind 10 Minuten gültig und nur einmal verwendbar.</li>
              <li>Fragen zu einzelnen Buchungen beantwortet {b.display_name} direkt.</li>
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          {(addressLine || locations.length > 0) && (
            <section className="card p-6" aria-labelledby="adresse">
              <h2 id="adresse" className="font-display text-xl font-semibold">Adresse</h2>
              {addressLine && <p className="mt-2 text-[15px] text-muted">{addressLine}</p>}
              {locations.length > 1 && (
                <ul className="mt-3 space-y-1 text-[15px] text-muted">
                  {locations.map((l) => (
                    <li key={l.id}>
                      <strong className="text-fg">{l.name}</strong>
                      {[l.address, [l.postal_code, l.city].filter(Boolean).join(" ")].filter(Boolean).length > 0 && (
                        <> – {[l.address, [l.postal_code, l.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm mt-4">
                  Auf der Karte öffnen
                </a>
              )}
            </section>
          )}

          {(showHours || b.hours_note) && (
            <section className="card p-6" aria-labelledby="zeiten">
              <h2 id="zeiten" className="font-display text-xl font-semibold">Öffnungszeiten</h2>
              {showHours && (
                <table className="mt-3 w-full text-[15px]">
                  <tbody>
                    {hours.map((h) => (
                      <tr key={h.day} className="border-b border-line last:border-0">
                        <th scope="row" className="py-2 text-left font-medium">{WEEKDAYS[h.day]}</th>
                        <td className="py-2 text-right text-muted tabular">{h.closed ? "geschlossen" : `${h.open} – ${h.close}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {b.hours_note && <p className="mt-3 text-sm text-faint">{b.hours_note}</p>}
            </section>
          )}

          {(b.phone || website || b.public_email || insta) && (
            <section className="card p-6" aria-labelledby="kontakt">
              <h2 id="kontakt" className="font-display text-xl font-semibold">Kontakt</h2>
              <ul className="mt-3 space-y-2 text-[15px]">
                {b.phone && (
                  <li>
                    <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className="text-accent hover:text-accent-hover">{b.phone}</a>
                  </li>
                )}
                {b.public_email && (
                  <li>
                    <a href={`mailto:${b.public_email}`} className="break-all text-accent hover:text-accent-hover">{b.public_email}</a>
                  </li>
                )}
                {website && (
                  <li>
                    <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-accent hover:text-accent-hover">
                      {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  </li>
                )}
                {insta && (
                  <li>
                    <a href={insta} target="_blank" rel="noopener noreferrer nofollow" className="text-accent hover:text-accent-hover">Instagram</a>
                  </li>
                )}
              </ul>
            </section>
          )}

          <p className="px-1 text-sm text-faint">
            Stimmt etwas mit diesem Profil nicht?{" "}
            <Link href={`/geschaefte/${b.slug}/melden`} className="underline underline-offset-2 hover:text-accent">
              Profil melden
            </Link>
          </p>
        </aside>
      </Container>
    </PublicShell>
  );
}
