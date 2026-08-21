"use client";

import Link from "next/link";
import { Fragment } from "react";
import WalletCard from "@/components/WalletCard";
import ScrollNav from "@/components/marketing/ScrollNav";
import Reveal from "@/components/marketing/Reveal";
import LiveDemo from "@/components/marketing/LiveDemo";
import ThemeLangProvider, { useThemeLang } from "@/components/marketing/ThemeLangProvider";
import { DEFAULT_DESIGN } from "@/lib/card-design";
import { PLANS } from "@/lib/billing/plans";
import { COMPANY } from "@/lib/legal/company-info";
import "@/components/marketing/landing.css";

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-[17px] h-[17px] shrink-0 mt-0.5 text-gold">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const PROBLEM_ICONS = [
  <svg key="p1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
  </svg>,
  <svg key="p2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M8 14l8-4" />
    <path d="M8 10l8 4" />
  </svg>,
  <svg key="p3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 0 1 4.9.7c0 1.6-2.4 1.9-2.4 3.3" />
    <path d="M12 17h.01" />
  </svg>,
  <svg key="p4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <path d="M11 18h2" />
    <path d="M4.5 4.5l15 15" />
  </svg>,
];

const BENEFIT_ICONS = [
  <svg key="b1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
    <rect x="5" y="2" width="14" height="20" rx="3" />
    <path d="M11 18h2" />
  </svg>,
  <svg key="b2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
    <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
  </svg>,
  <svg key="b3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
    <path d="M3 12a9 9 0 1 0 9-9" />
    <path d="M3 4v5h5" />
  </svg>,
  <svg key="b4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
    <path d="M12 3v18" />
    <path d="M5 8l7-5 7 5" />
    <path d="M5 16l7 5 7-5" />
  </svg>,
];

function Content({ heroQr }: { heroQr: string }) {
  const { t, lang } = useThemeLang();

  const whatsappMsg = encodeURIComponent(t.whatsappText);
  const whatsapp = "https://wa.me/" + COMPANY.phone.replace(/[^\d]/g, "") + "?text=" + whatsappMsg;
  const mailto = `mailto:${COMPANY.email}?subject=${encodeURIComponent(t.emailSubject)}&body=${encodeURIComponent(t.emailBody)}`;
  const year = new Date().getFullYear();

  return (
    <main className="overflow-x-hidden">
      <ScrollNav />

      {/* HERO */}
      <header className="relative pt-[150px] pb-[90px] overflow-hidden">
        <div
          className="pointer-events-none absolute -top-[10%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(closest-side, var(--lp-gold-bg), transparent 70%)" }}
        />
        <div className="max-w-[1160px] mx-auto px-6 relative grid grid-cols-1 gap-14 items-center lg:grid-cols-[1.05fr_0.95fr]">
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-[2.5px] uppercase text-gold">{t.hero.eyebrow}</div>
            <h1 className="text-[38px] sm:text-[52px] lg:text-[62px] leading-[1.03] tracking-[-1.8px] font-extrabold mt-5 mb-5">
              {t.hero.h1a}{" "}
              <span className="bg-gold-grad bg-clip-text text-transparent">{t.hero.h1b}</span>
            </h1>
            <p className="text-base sm:text-lg text-dim max-w-[520px] mb-8">{t.hero.lead}</p>
            <div className="flex gap-3.5 flex-wrap">
              <Link href="/register" className="btn btn-primary">
                {t.hero.ctaPrimary}
              </Link>
              <a href="#demo" className="btn btn-ghost">
                {t.hero.ctaSecondary}
              </a>
            </div>
            <div className="mt-5 text-[13px] text-faint flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#4ade80] shrink-0" />
              {t.hero.note}
            </div>
          </div>

          <div className="mx-auto min-w-0 w-full max-w-[404px]">
            <div
              className="relative w-full rounded-[42px] p-3 border border-line-2 shadow-[0_40px_90px_rgba(0,0,0,0.6)]"
              style={{ background: "linear-gradient(160deg,#26222b,#141117)" }}
            >
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-[110px] h-[22px] bg-[#0B0A0D] rounded-b-2xl z-10" />
              <div className="bg-[#0B0A0D] rounded-[32px] pt-9 px-4 pb-5 flex flex-col justify-center gap-4 overflow-x-auto">
                <WalletCard
                  title="Café Central"
                  design={DEFAULT_DESIGN}
                  type="stamp"
                  stamps={7}
                  stampsRequired={10}
                  points={0}
                  pointsPerReward={100}
                  reward={lang === "de" ? "1 Gratis-Kaffee" : "1 free coffee"}
                  serial="demo"
                  qrDataUrl={heroQr}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* TRUST */}
      <div className="py-6 border-t border-b border-line">
        <div className="max-w-[1160px] mx-auto px-6 flex items-center justify-center gap-9 flex-wrap text-faint text-sm font-semibold tracking-wide">
          {t.trust.map((item, i) => (
            <Fragment key={item}>
              {i > 0 && <span>·</span>}
              <span>{item}</span>
            </Fragment>
          ))}
        </div>
      </div>

      {/* PROBLEM */}
      <section className="py-24">
        <div className="max-w-[1160px] mx-auto px-6">
          <Reveal className="text-center max-w-[640px] mx-auto mb-14">
            <div className="text-xs font-bold tracking-[2.5px] uppercase mb-3" style={{ color: "var(--lp-rose)" }}>
              {t.problem.eyebrow}
            </div>
            <h2 className="text-[28px] sm:text-[38px] tracking-[-1px] font-extrabold leading-tight mb-3.5">{t.problem.h2}</h2>
            <p className="text-dim text-base sm:text-lg">{t.problem.sub}</p>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {t.problem.items.map((p, i) => (
              <Reveal key={p.title} delayMs={i * 60}>
                <div className="card p-6 flex gap-4 h-full">
                  <div
                    className="w-11 h-11 rounded-xl shrink-0 grid place-items-center"
                    style={{ background: "var(--lp-rose-bg)", color: "var(--lp-rose)" }}
                  >
                    {PROBLEM_ICONS[i]}
                  </div>
                  <div>
                    <h3 className="text-[17px] tracking-[-0.2px] mb-1.5 font-semibold">{p.title}</h3>
                    <p className="text-dim text-[14.5px]">{p.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delayMs={240} className="text-center mt-12">
            <div className="text-xs font-bold tracking-[2.5px] uppercase text-gold mb-2.5">{t.problem.solutionEyebrow}</div>
            <p className="text-xl sm:text-2xl font-bold tracking-[-0.4px] max-w-[560px] mx-auto">{t.problem.solution}</p>
          </Reveal>
        </div>
      </section>

      {/* HOW */}
      <section className="py-24" id="how">
        <div className="max-w-[1160px] mx-auto px-6">
          <Reveal className="text-center max-w-[640px] mx-auto mb-14">
            <div className="text-xs font-bold tracking-[2.5px] uppercase text-gold mb-3">{t.how.eyebrow}</div>
            <h2 className="text-[28px] sm:text-[38px] tracking-[-1px] font-extrabold leading-tight mb-3.5">{t.how.h2}</h2>
            <p className="text-dim text-base sm:text-lg">{t.how.sub}</p>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {t.how.steps.map((s, i) => (
              <Reveal key={s.title} delayMs={i * 80}>
                <div className="card p-7 h-full">
                  <div
                    className="w-[38px] h-[38px] rounded-[11px] text-gold grid place-items-center font-extrabold text-[17px] mb-4.5"
                    style={{ background: "var(--lp-gold-bg)" }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="text-lg tracking-[-0.3px] mb-2 font-semibold">{s.title}</h3>
                  <p className="text-dim text-[15px]">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section
        className="py-24"
        id="demo"
        style={{ background: "radial-gradient(700px 380px at 80% 0%, var(--lp-gold-bg), transparent 60%), var(--lp-bg-2)" }}
      >
        <div className="max-w-[1160px] mx-auto px-6">
          <Reveal className="text-center max-w-[640px] mx-auto mb-14">
            <div className="text-xs font-bold tracking-[2.5px] uppercase text-gold mb-3">{t.demo.eyebrow}</div>
            <h2 className="text-[28px] sm:text-[38px] tracking-[-1px] font-extrabold leading-tight mb-3.5">{t.demo.h2}</h2>
            <p className="text-dim text-base sm:text-lg">{t.demo.sub}</p>
          </Reveal>
          <Reveal>
            <LiveDemo />
          </Reveal>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-24">
        <div className="max-w-[1160px] mx-auto px-6">
          <Reveal className="text-center max-w-[640px] mx-auto mb-14">
            <div className="text-xs font-bold tracking-[2.5px] uppercase text-gold mb-3">{t.benefits.eyebrow}</div>
            <h2 className="text-[28px] sm:text-[38px] tracking-[-1px] font-extrabold leading-tight">
              {t.benefits.h2a}
              <br />
              {t.benefits.h2b}
            </h2>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {t.benefits.items.map((b, i) => (
              <Reveal key={b.title} delayMs={i * 60}>
                <div className="card p-6 flex gap-4">
                  <div
                    className="w-11 h-11 rounded-xl shrink-0 grid place-items-center text-gold"
                    style={{ background: "var(--lp-gold-bg)" }}
                  >
                    {BENEFIT_ICONS[i]}
                  </div>
                  <div>
                    <h3 className="text-[17px] tracking-[-0.2px] mb-1.5 font-semibold">{b.title}</h3>
                    <p className="text-dim text-[14.5px]">{b.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-24" id="preise">
        <div className="max-w-[1160px] mx-auto px-6">
          <Reveal className="text-center max-w-[640px] mx-auto mb-14">
            <div className="text-xs font-bold tracking-[2.5px] uppercase text-gold mb-3">{t.pricing.eyebrow}</div>
            <h2 className="text-[28px] sm:text-[38px] tracking-[-1px] font-extrabold leading-tight mb-3.5">{t.pricing.h2}</h2>
            <p className="text-dim text-base sm:text-lg">{t.pricing.sub}</p>
          </Reveal>
          <div className="grid gap-5 max-w-[1000px] mx-auto md:grid-cols-3">
            {PLANS.map((plan, i) => {
              const featured = plan.id === "business";
              return (
                <Reveal key={plan.id} delayMs={i * 80}>
                  <div
                    className="relative rounded-[18px] border p-8 h-full flex flex-col"
                    style={{
                      borderColor: featured ? "rgba(232,181,115,0.5)" : "var(--lp-line)",
                      background: featured
                        ? "linear-gradient(180deg, var(--lp-gold-bg), var(--lp-surface))"
                        : "var(--lp-surface)",
                    }}
                  >
                    {featured && (
                      <div className="absolute -top-3 right-6 bg-gold-grad text-[#241a0c] text-[11px] font-extrabold tracking-wide px-3 py-1.5 rounded-full">
                        {t.pricing.popular}
                      </div>
                    )}
                    <div className="text-[13px] font-bold tracking-wide uppercase text-gold">{plan.name}</div>
                    <div className="text-[36px] font-extrabold tracking-[-1.5px] mt-3 mb-0.5">
                      {plan.displayPriceMonthly} € <small className="text-base font-semibold text-dim">{t.pricing.perMonth}</small>
                    </div>
                    <div className="text-[13px] text-faint mb-5">{plan.tagline}</div>
                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-2.5 items-start text-[14.5px] text-dim">
                          {CHECK}
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/register" className={`btn ${featured ? "btn-primary" : "btn-ghost"} w-full`}>
                      {t.pricing.cta}
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <p className="text-center text-faint text-sm mt-7">
            {t.pricing.question}{" "}
            <a href={mailto} className="text-gold hover:text-gold-bright">
              {t.pricing.questionLink}
            </a>
            .
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-[1160px] mx-auto px-6">
          <Reveal>
            <div
              className="rounded-[26px] border border-line-2 py-16 px-8 text-center"
              style={{
                background:
                  "radial-gradient(600px 300px at 50% 0%, var(--lp-gold-bg), transparent 65%), var(--lp-surface)",
              }}
            >
              <h2 className="text-[28px] sm:text-[40px] tracking-[-1.2px] font-extrabold mb-4">{t.cta.h2}</h2>
              <p className="text-dim text-lg max-w-[520px] mx-auto mb-7">{t.cta.sub}</p>
              <div className="flex gap-3.5 justify-center flex-wrap">
                <Link href="/register" className="btn btn-primary">
                  {t.cta.primary}
                </Link>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  {t.cta.whatsapp}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line py-11">
        <div className="max-w-[1160px] mx-auto px-6 flex flex-wrap items-center justify-between gap-5 text-faint text-sm">
          <div className="flex items-center gap-2.5 font-bold text-[color:var(--lp-text)]">
            <div className="w-8 h-8 rounded-[9px] grid place-items-center font-extrabold text-[#241a0c] bg-gold-grad">M</div>
            {COMPANY.tradingName}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              {COMPANY.city} · {COMPANY.country} ·{" "}
              <a href={mailto} className="hover:text-gold-bright">
                {COMPANY.email}
              </a>
            </span>
            <Link href="/impressum" className="hover:text-gold-bright">
              {t.footer.impressum}
            </Link>
            <Link href="/datenschutz" className="hover:text-gold-bright">
              {t.footer.datenschutz}
            </Link>
            <Link href="/agb" className="hover:text-gold-bright">
              {t.footer.agb}
            </Link>
          </div>
          <div>
            © {year} {COMPANY.tradingName}
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function LandingClient({ heroQr }: { heroQr: string }) {
  return (
    <ThemeLangProvider>
      <Content heroQr={heroQr} />
    </ThemeLangProvider>
  );
}
