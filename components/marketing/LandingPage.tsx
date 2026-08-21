import Link from "next/link";
import QRCode from "qrcode";
import WalletCard from "@/components/WalletCard";
import ScrollNav from "@/components/marketing/ScrollNav";
import Reveal from "@/components/marketing/Reveal";
import LiveDemo from "@/components/marketing/LiveDemo";
import { DEFAULT_DESIGN } from "@/lib/card-design";
import { PLANS } from "@/lib/billing/plans";
import { COMPANY } from "@/lib/legal/company-info";

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-[17px] h-[17px] shrink-0 mt-0.5 text-gold">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const STEPS = [
  {
    title: "QR-Aufsteller am Tresen",
    body: "Dein Kunde scannt den QR-Code und legt die Karte in Sekunden in sein Handy. Kein Download, keine Anmeldung.",
  },
  {
    title: "Bei jedem Besuch stempeln",
    body: "Nach dem Bezahlen zeigt der Kunde seine Karte, dein Team scannt sie kurz – ein Stempel oder Punkte drauf, fertig.",
  },
  {
    title: "Belohnung einlösen",
    body: "Ist die Karte voll, gibt's die Belohnung. Der Kunde freut sich – und kommt für die nächste wieder.",
  },
];

const BENEFITS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <path d="M11 18h2" />
      </svg>
    ),
    title: "Keine App nötig",
    body: "Läuft in Apple Wallet und Google Wallet – die jeder Kunde schon auf dem Handy hat.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
        <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
      </svg>
    ),
    title: "In 2 Sekunden gestempelt",
    body: "Kurz den Code scannen – fertig. Kein Papierkram, keine verlorenen Kärtchen mehr.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
        <path d="M3 12a9 9 0 1 0 9-9" />
        <path d="M3 4v5h5" />
      </svg>
    ),
    title: "Kunden kommen öfter",
    body: "Ein Ziel vor Augen bringt Gäste zurück – für den nächsten Stempel und die nächste Belohnung.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
        <path d="M12 3v18" />
        <path d="M5 8l7-5 7 5" />
        <path d="M5 16l7 5 7-5" />
      </svg>
    ),
    title: "Immer aktuell",
    body: "Neuer Stempel, neue Belohnung, neue Aktion – die Karte im Handy aktualisiert sich von selbst.",
  },
];

export default async function LandingPage() {
  const heroQr = await QRCode.toDataURL("https://matei.systems/c/demo", {
    margin: 1,
    width: 160,
    color: { dark: "#111111", light: "#ffffff" },
  });

  const whatsapp = "https://wa.me/" + COMPANY.phone.replace(/[^\d]/g, "");
  const year = new Date().getFullYear();

  return (
    <main className="bg-ink text-[#F4F1EC] overflow-x-hidden">
      <ScrollNav />

      {/* HERO */}
      <header className="relative pt-[150px] pb-[90px] overflow-hidden">
        <div
          className="pointer-events-none absolute -top-[10%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(232,181,115,0.14), transparent 70%)" }}
        />
        <div className="max-w-[1160px] mx-auto px-6 relative grid grid-cols-1 gap-14 items-center lg:grid-cols-[1.05fr_0.95fr]">
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-[2.5px] uppercase text-gold">Digitale Treuekarte</div>
            <h1 className="text-[38px] sm:text-[52px] lg:text-[62px] leading-[1.03] tracking-[-1.8px] font-extrabold mt-5 mb-5">
              Aus Laufkundschaft werden{" "}
              <span className="bg-gold-grad bg-clip-text text-transparent">Stammgäste.</span>
            </h1>
            <p className="text-base sm:text-lg text-dim max-w-[520px] mb-8">
              Die Treuekarte deines Betriebs – direkt im Handy deiner Kunden. Stempel sammeln, Belohnungen einlösen.
              Ganz ohne App, ohne Plastik, ohne Papier.
            </p>
            <div className="flex gap-3.5 flex-wrap">
              <Link href="/register" className="btn btn-primary">
                14 Tage kostenlos starten
              </Link>
              <a href="#demo" className="btn btn-ghost">
                Live-Demo ansehen
              </a>
            </div>
            <div className="mt-5 text-[13px] text-faint flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#4ade80]" />
              Läuft in Apple&nbsp;Wallet &amp; Google&nbsp;Wallet – schon auf jedem Handy.
            </div>
          </div>

          <div className="mx-auto min-w-0 w-full max-w-[404px]">
            <div
              className="relative w-full rounded-[42px] p-3 border border-line-2 shadow-[0_40px_90px_rgba(0,0,0,0.6)]"
              style={{ background: "linear-gradient(160deg,#26222b,#141117)" }}
            >
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-[110px] h-[22px] bg-ink rounded-b-2xl z-10" />
              <div className="bg-ink rounded-[32px] pt-9 px-4 pb-5 flex flex-col justify-center gap-4 overflow-x-auto">
                <WalletCard
                  title="Café Central"
                  design={DEFAULT_DESIGN}
                  type="stamp"
                  stamps={7}
                  stampsRequired={10}
                  points={0}
                  pointsPerReward={100}
                  reward="1 Gratis-Kaffee"
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
          <span>Cafés</span>
          <span>·</span>
          <span>Friseure</span>
          <span>·</span>
          <span>Restaurants</span>
          <span>·</span>
          <span>Bäckereien</span>
          <span>·</span>
          <span>Kosmetikstudios</span>
        </div>
      </div>

      {/* HOW */}
      <section className="py-24" id="how">
        <div className="max-w-[1160px] mx-auto px-6">
          <Reveal className="text-center max-w-[640px] mx-auto mb-14">
            <div className="text-xs font-bold tracking-[2.5px] uppercase text-gold mb-3">So einfach geht&apos;s</div>
            <h2 className="text-[28px] sm:text-[38px] tracking-[-1px] font-extrabold leading-tight mb-3.5">
              In drei Schritten zur eigenen Treuekarte
            </h2>
            <p className="text-dim text-base sm:text-lg">Kein technisches Wissen nötig – für dich und für deine Kunden.</p>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delayMs={i * 80}>
                <div className="card p-7 h-full">
                  <div className="w-[38px] h-[38px] rounded-[11px] bg-[rgba(232,181,115,0.12)] text-gold grid place-items-center font-extrabold text-[17px] mb-4.5">
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
        style={{ background: "radial-gradient(700px 380px at 80% 0%, rgba(232,181,115,0.08), transparent 60%), #100E12" }}
      >
        <div className="max-w-[1160px] mx-auto px-6">
          <Reveal className="text-center max-w-[640px] mx-auto mb-14">
            <div className="text-xs font-bold tracking-[2.5px] uppercase text-gold mb-3">Live-Demo</div>
            <h2 className="text-[28px] sm:text-[38px] tracking-[-1px] font-extrabold leading-tight mb-3.5">Sieh deine eigene Karte</h2>
            <p className="text-dim text-base sm:text-lg">
              Gib deinen Betrieb ein und schau live zu, wie die Treuekarte im Handy deiner Kunden aussieht.
            </p>
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
            <div className="text-xs font-bold tracking-[2.5px] uppercase text-gold mb-3">Warum digital</div>
            <h2 className="text-[28px] sm:text-[38px] tracking-[-1px] font-extrabold leading-tight">
              Papierkarten gehen verloren.
              <br />
              Das Handy nicht.
            </h2>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delayMs={i * 60}>
                <div className="card p-6 flex gap-4">
                  <div className="w-11 h-11 rounded-xl shrink-0 grid place-items-center bg-[rgba(232,181,115,0.12)] text-gold">
                    {b.icon}
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
            <div className="text-xs font-bold tracking-[2.5px] uppercase text-gold mb-3">Preise</div>
            <h2 className="text-[28px] sm:text-[38px] tracking-[-1px] font-extrabold leading-tight mb-3.5">Einfach &amp; planbar</h2>
            <p className="text-dim text-base sm:text-lg">14 Tage kostenlos testen, danach ein fixer Monatsbeitrag. Keine versteckten Kosten.</p>
          </Reveal>
          <div className="grid gap-5 max-w-[1000px] mx-auto md:grid-cols-3">
            {PLANS.map((plan, i) => {
              const featured = plan.id === "business";
              return (
                <Reveal key={plan.id} delayMs={i * 80}>
                  <div
                    className={`relative rounded-[18px] border p-8 h-full flex flex-col ${
                      featured ? "border-[rgba(232,181,115,0.5)]" : "border-line bg-[#16131A]"
                    }`}
                    style={
                      featured
                        ? { background: "linear-gradient(180deg, rgba(232,181,115,0.06), #16131A)" }
                        : undefined
                    }
                  >
                    {featured && (
                      <div className="absolute -top-3 right-6 bg-gold-grad text-[#241a0c] text-[11px] font-extrabold tracking-wide px-3 py-1.5 rounded-full">
                        BELIEBT
                      </div>
                    )}
                    <div className="text-[13px] font-bold tracking-wide uppercase text-gold">{plan.name}</div>
                    <div className="text-[36px] font-extrabold tracking-[-1.5px] mt-3 mb-0.5">
                      {plan.displayPriceMonthly} € <small className="text-base font-semibold text-dim">/ Monat</small>
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
                      Jetzt starten
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <p className="text-center text-faint text-sm mt-7">
            Fragen zu deinem Tarif?{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-gold hover:text-gold-bright">
              Schreib uns
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
              style={{ background: "radial-gradient(600px 300px at 50% 0%, rgba(232,181,115,0.12), transparent 65%), #16131A" }}
            >
              <h2 className="text-[28px] sm:text-[40px] tracking-[-1.2px] font-extrabold mb-4">Bereit für deine Treuekarte?</h2>
              <p className="text-dim text-lg max-w-[520px] mx-auto mb-7">
                In wenigen Minuten ist deine digitale Kundenkarte startklar – kein technisches Wissen nötig.
              </p>
              <div className="flex gap-3.5 justify-center flex-wrap">
                <Link href="/register" className="btn btn-primary">
                  Jetzt kostenlos starten
                </Link>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  WhatsApp schreiben
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line py-11">
        <div className="max-w-[1160px] mx-auto px-6 flex flex-wrap items-center justify-between gap-5 text-faint text-sm">
          <div className="flex items-center gap-2.5 font-bold text-[#F4F1EC]">
            <div className="w-8 h-8 rounded-[9px] grid place-items-center font-extrabold text-[#241a0c] bg-gold-grad">M</div>
            {COMPANY.tradingName}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              {COMPANY.city} · {COMPANY.country} ·{" "}
              <a href={`mailto:${COMPANY.email}`} className="hover:text-gold-bright">
                {COMPANY.email}
              </a>
            </span>
            <Link href="/impressum" className="hover:text-gold-bright">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-gold-bright">
              Datenschutz
            </Link>
            <Link href="/agb" className="hover:text-gold-bright">
              AGB
            </Link>
          </div>
          <div>© {year} {COMPANY.tradingName}</div>
        </div>
      </footer>
    </main>
  );
}
