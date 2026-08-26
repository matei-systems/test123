"use client";

import Link from "next/link";
import ScrollNav from "@/components/marketing/ScrollNav";
import Reveal from "@/components/marketing/Reveal";
import SpotlightCard from "@/components/marketing/SpotlightCard";
import ThemeProvider, { useTheme } from "@/components/marketing/ThemeProvider";
import { COMPANY } from "@/lib/legal/company-info";
import "@/components/marketing/landing.css";

const ICONS = [
  // Websites
  <svg key="s1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18" />
    <path d="M7 6.5h.01M10 6.5h.01" />
  </svg>,
  // KI-Chatbots
  <svg key="s2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
    <rect x="4" y="5" width="16" height="12" rx="3" />
    <path d="M9 21v-2M15 21v-2" />
    <path d="M8.5 10.5h.01M15.5 10.5h.01" />
    <path d="M9 13.5c1 1 5 1 6 0" />
  </svg>,
  // KI-Telefonassistent
  <svg key="s3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
    <path d="M4.5 4.5c1 5 5.5 9.5 6.5 9.5s2-.7 3-1.5c.6-.5 1.4-.4 1.9.1l2.6 2.6c.6.6.6 1.5 0 2.1-1.1 1.1-2.8 2.1-4.9 1.6-5-1.1-9.4-5.5-10.5-10.5-.5-2.1.5-3.8 1.6-4.9.6-.6 1.5-.6 2.1 0Z" />
  </svg>,
  // Automatisierung
  <svg key="s4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    <circle cx="12" cy="12" r="4" />
  </svg>,
];

function Content() {
  const { t } = useTheme();
  const whatsappMsg = encodeURIComponent(
    `Hallo! Ich interessiere mich für digitale Dienstleistungen (Website/KI-Chatbot/Automatisierung) von Matei Systems.`
  );
  const whatsapp = "https://wa.me/" + COMPANY.phone.replace(/[^\d]/g, "") + "?text=" + whatsappMsg;
  const year = new Date().getFullYear();

  return (
    <main className="overflow-x-hidden">
      <ScrollNav />

      <header className="relative pt-[140px] pb-16 overflow-hidden">
        <div
          className="pointer-events-none absolute -top-[15%] left-1/2 -translate-x-1/2 w-[700px] h-[520px] rounded-full"
          style={{ background: "radial-gradient(closest-side, var(--lp-line-2), transparent 70%)" }}
        />
        <div className="max-w-[760px] mx-auto px-6 relative text-center">
          <Reveal>
            <div className="text-xs font-bold tracking-[2.5px] uppercase text-faint">{t.services.eyebrow}</div>
            <h1 className="text-[30px] sm:text-[40px] leading-[1.1] tracking-[-1.2px] font-extrabold mt-4 mb-5">{t.services.h1}</h1>
            <p className="text-dim text-base sm:text-lg max-w-[560px] mx-auto">{t.services.lead}</p>
          </Reveal>
        </div>
      </header>

      <section className="pb-20">
        <div className="max-w-[900px] mx-auto px-6 grid gap-5 sm:grid-cols-2">
          {t.services.items.map((item, i) => (
            <Reveal key={item.title} delayMs={i * 70}>
              <SpotlightCard className="card p-7 h-full">
                <div
                  className="w-11 h-11 rounded-xl shrink-0 grid place-items-center mb-4"
                  style={{ background: "var(--lp-line-2)", color: "var(--lp-text)" }}
                >
                  {ICONS[i]}
                </div>
                <div className="text-[11px] font-bold tracking-[1.5px] uppercase text-faint mb-1.5">{item.tag}</div>
                <h3 className="text-[17px] tracking-[-0.2px] mb-2 font-semibold">{item.title}</h3>
                <p className="text-dim text-[14.5px]">{item.body}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-[900px] mx-auto px-6">
          <Reveal>
            <div
              className="rounded-[22px] border border-line-2 py-14 px-8 text-center"
              style={{ background: "var(--lp-surface)" }}
            >
              <div className="text-xs font-bold tracking-[2.5px] uppercase text-faint mb-3">{t.services.ctaEyebrow}</div>
              <h2 className="text-[24px] sm:text-[30px] tracking-[-0.8px] font-extrabold mb-3">{t.services.ctaTitle}</h2>
              <p className="text-dim text-base max-w-[440px] mx-auto mb-7">{t.services.ctaBody}</p>
              <div className="flex gap-3.5 justify-center flex-wrap">
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  {t.services.ctaButton}
                </a>
                <Link href="/" className="btn btn-ghost">
                  {t.services.backToLoyalty}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-line py-11">
        <div className="max-w-[1160px] mx-auto px-6 flex flex-wrap items-center justify-between gap-5 text-faint text-sm">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-[color:var(--lp-text)]">
            <div className="w-8 h-8 rounded-[9px] grid place-items-center font-extrabold text-[#241a0c] bg-gold-grad">M</div>
            {COMPANY.tradingName}
          </Link>
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              {COMPANY.city} · {COMPANY.country}
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

export default function ServicesClient() {
  return (
    <ThemeProvider>
      <Content />
    </ThemeProvider>
  );
}
