"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import QRCode from "qrcode";
import WalletCard from "@/components/WalletCard";
import ImageUpload from "@/components/programs/ImageUpload";
import { THEMES } from "@/lib/themes";
import { DEFAULT_DESIGN, type CardDesign, type BaseMode, type CornerRadius } from "@/lib/card-design";
import { STAMP_ICON_PRESETS } from "@/lib/stamp-icons";
import { createProgram, updateProgram, type ProgramInput } from "@/app/dashboard/programs/actions";

const STEPS = ["Grundlagen", "Design", "Belohnung", "Überprüfen"];

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input {...props} className="input" />
      {hint && <div className="text-xs text-faint mt-1.5">{hint}</div>}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={valid ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-line bg-transparent cursor-pointer shrink-0"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input font-mono text-sm"
          maxLength={7}
          placeholder="#3B2A20"
        />
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="label mb-0">{label}</label>
        <span className="text-xs text-faint">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: "#E8B573" }}
      />
    </div>
  );
}

const BASE_MODE_LABEL: Record<BaseMode, string> = { gradient: "Verlauf", color: "Farbe" };
const RADIUS_LABEL: Record<CornerRadius, string> = { lg: "Dezent", xl: "Mittel", "2xl": "Rund" };

export default function ProgramWizard({
  mode,
  programId,
  initial,
}: {
  mode: "create" | "edit";
  programId?: string;
  initial?: ProgramInput;
}) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  const [input, setInput] = useState<ProgramInput>(
    initial ?? {
      name: "",
      title: "",
      type: "stamp",
      stampsRequired: 10,
      pointsPerReward: 100,
      rewardDescription: "",
      design: DEFAULT_DESIGN,
      earningMode: "manual",
      minPurchaseAmount: null,
      amountPerPoint: null,
    }
  );

  function set<K extends keyof ProgramInput>(key: K, value: ProgramInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function setDesign<K extends keyof CardDesign>(key: K, value: CardDesign[K]) {
    setInput((prev) => ({ ...prev, design: { ...prev.design, [key]: value } }));
  }

  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    QRCode.toDataURL(`${appUrl}/c/vorschau`, { margin: 1, width: 160, color: { dark: "#111111", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, []);

  const previewStamps = useMemo(() => Math.min(input.stampsRequired, Math.ceil(input.stampsRequired * 0.7)), [input.stampsRequired]);
  const previewPoints = useMemo(() => Math.round(input.pointsPerReward * 0.6), [input.pointsPerReward]);

  function stepValid(i: number): string | null {
    if (i === 0) {
      if (!input.name.trim()) return "Bitte gib einen internen Programmnamen an.";
      if (!input.title.trim()) return "Bitte gib einen Anzeigenamen an.";
    }
    if (i === 2) {
      if (!input.rewardDescription.trim()) return "Bitte beschreibe die Belohnung.";
      if (input.earningMode === "amount") {
        if (input.type === "stamp" && (!input.minPurchaseAmount || input.minPurchaseAmount <= 0))
          return "Bitte gib den Mindestbetrag für einen Stempel an.";
        if (input.type === "points" && (!input.amountPerPoint || input.amountPerPoint <= 0))
          return "Bitte gib den Betrag pro Punkt an.";
      }
    }
    return null;
  }

  function next() {
    const err = stepValid(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = mode === "create" ? await createProgram(input) : await updateProgram(programId!, input);
      if (res.error) {
        setError(res.error);
        return;
      }
      const targetId = mode === "create" ? (res as any).id : programId;
      // Full navigation - see the comment in DeleteProgramButton for why
      // router.push() here can serve a stale client-cached copy of the
      // target page even after revalidatePath() ran server-side.
      window.location.href = `/dashboard/programs/${targetId}`;
    });
  }

  const d = input.design;
  const hasLogo = Boolean(d.logoImage);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="card p-6 md:p-8 min-w-0">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 shrink-0">
              <div
                className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold shrink-0 transition-colors ${
                  i === step
                    ? "bg-gold-grad text-[#241a0c]"
                    : i < step
                    ? "bg-[rgba(232,181,115,0.2)] text-gold-bright"
                    : "bg-white/[0.06] text-faint"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${i === step ? "text-[#F4F1EC]" : "text-faint"}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-white/10 shrink-0" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-5 text-sm rounded-lg px-3 py-2.5" style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5" }}>
            {error}
          </div>
        )}

        {/* Step 0: Grundlagen */}
        {step === 0 && (
          <div className="space-y-4 enter">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Programmname (intern)" value={input.name} onChange={(e) => set("name", e.target.value)} placeholder="Kaffee-Treuekarte" />
              <Field label="Anzeigename auf der Karte" value={input.title} onChange={(e) => set("title", e.target.value)} placeholder="Café Central" />
            </div>
            <div>
              <label className="label">Typ</label>
              <div className="inline-flex flex-wrap bg-ink border border-line rounded-xl p-1 gap-1">
                {(["stamp", "points"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("type", t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      input.type === t ? "bg-white/[0.08] text-[#F4F1EC]" : "text-faint hover:text-[#F4F1EC]"
                    }`}
                  >
                    {t === "stamp" ? "Stempelkarte" : "Punktekarte"}
                  </button>
                ))}
              </div>
            </div>
            {input.type === "stamp" ? (
              <Field
                label="Stempel bis Belohnung"
                type="number"
                min={3}
                max={30}
                value={input.stampsRequired}
                onChange={(e) => set("stampsRequired", Number(e.target.value) || 10)}
                hint="Frei wählbar von 3 bis 30 - z. B. 5 für schnelle Rewards, 10 klassisch, 20 für hochpreisige Belohnungen."
              />
            ) : (
              <Field
                label="Punkte bis Belohnung"
                type="number"
                min={10}
                value={input.pointsPerReward}
                onChange={(e) => set("pointsPerReward", Number(e.target.value) || 100)}
              />
            )}
          </div>
        )}

        {/* Step 1: Design */}
        {step === 1 && (
          <div className="space-y-7 enter">
            <div>
              <label className="label">Basisfarbe</label>
              <div className="text-xs text-faint mb-3">
                Sichtbar in Kopf-/Fußbereich der Karte, und als Hintergrund, falls kein Bannerbild hinterlegt ist.
              </div>
              <div className="inline-flex flex-wrap bg-ink border border-line rounded-xl p-1 gap-1 mb-4">
                {(["gradient", "color"] as BaseMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDesign("baseMode", m)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      d.baseMode === m ? "bg-white/[0.08] text-[#F4F1EC]" : "text-faint hover:text-[#F4F1EC]"
                    }`}
                  >
                    {BASE_MODE_LABEL[m]}
                  </button>
                ))}
              </div>

              {d.baseMode === "gradient" && (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-faint mb-2">Schnellauswahl</div>
                    <div className="flex gap-3 flex-wrap">
                      {THEMES.map((t, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setDesign("gradientFrom", t.from);
                            setDesign("gradientTo", t.to);
                          }}
                          className={`w-10 h-10 rounded-lg transition-transform hover:scale-105 ${
                            d.gradientFrom === t.from && d.gradientTo === t.to ? "ring-2 ring-gold ring-offset-2 ring-offset-[#16131A]" : ""
                          }`}
                          style={{ background: `linear-gradient(140deg, ${t.from}, ${t.to})` }}
                          title={t.name}
                          aria-label={t.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ColorField label="Farbe von" value={d.gradientFrom} onChange={(v) => setDesign("gradientFrom", v)} />
                    <ColorField label="Farbe bis" value={d.gradientTo} onChange={(v) => setDesign("gradientTo", v)} />
                  </div>
                </div>
              )}

              {d.baseMode === "color" && <ColorField label="Kartenfarbe" value={d.solidColor} onChange={(v) => setDesign("solidColor", v)} />}
            </div>

            <div className="pt-2 border-t border-white/[0.06]">
              <label className="label">Bannerbild</label>
              <div className="text-xs text-faint mb-3">
                Großes Foto in der Kartenmitte, auf dem die Stempel liegen - so wie bei den hochwertigsten Wallet-Karten am Markt.
                Optional, aber empfohlen.
              </div>
              <ImageUpload
                kind="banner"
                aspect="wide"
                value={d.bannerImage}
                onChange={(url, luminance) => {
                  setDesign("bannerImage", url);
                  if (luminance !== undefined) setDesign("bannerLuminance", luminance);
                }}
              />
              {d.bannerImage && (
                <div className="mt-4">
                  <Slider
                    label="Bildausschnitt"
                    value={d.bannerFocalY}
                    min={0}
                    max={100}
                    onChange={(v) => setDesign("bannerFocalY", v)}
                  />
                  <div className="text-xs text-faint mt-2">
                    Für gute Lesbarkeit wird automatisch ein dezenter Verlauf über das Bild gelegt.
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="label">Textfarbe</label>
              <div className="inline-flex flex-wrap bg-ink border border-line rounded-xl p-1 gap-1 mb-3">
                <button
                  type="button"
                  onClick={() => setDesign("textColor", "auto")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    d.textColor === "auto" ? "bg-white/[0.08] text-[#F4F1EC]" : "text-faint hover:text-[#F4F1EC]"
                  }`}
                >
                  Automatisch
                </button>
                <button
                  type="button"
                  onClick={() => setDesign("textColor", d.textColor === "auto" ? "#FFFFFF" : d.textColor)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    d.textColor !== "auto" ? "bg-white/[0.08] text-[#F4F1EC]" : "text-faint hover:text-[#F4F1EC]"
                  }`}
                >
                  Manuell
                </button>
              </div>
              {d.textColor !== "auto" && (
                <ColorField label="Textfarbe" value={d.textColor} onChange={(v) => setDesign("textColor", v)} />
              )}
            </div>

            <div>
              <label className="label">Kartenform</label>
              <div className="inline-flex flex-wrap bg-ink border border-line rounded-xl p-1 gap-1">
                {(["lg", "xl", "2xl"] as CornerRadius[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDesign("cornerRadius", r)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      d.cornerRadius === r ? "bg-white/[0.08] text-[#F4F1EC]" : "text-faint hover:text-[#F4F1EC]"
                    }`}
                  >
                    {RADIUS_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>

            {input.type === "stamp" && (
              <div className="pt-2 border-t border-white/[0.06]">
                <label className="label">Stempel-Icon</label>
                <div className="text-xs text-faint mb-3">
                  Erscheint groß auf jedem Stempel - passend zur Branche (Café, Friseur, Fitness, Beauty, …).
                </div>
                <div className="flex gap-2 flex-wrap mb-4">
                  {STAMP_ICON_PRESETS.map((icon) => (
                    <button
                      key={icon.key}
                      type="button"
                      onClick={() => {
                        setDesign("stampIconKey", icon.key);
                        setDesign("stampIconImage", null);
                      }}
                      title={icon.label}
                      aria-label={icon.label}
                      className={`w-10 h-10 rounded-lg grid place-items-center border transition-colors ${
                        !d.stampIconImage && d.stampIconKey === icon.key
                          ? "border-gold bg-[rgba(232,181,115,0.12)]"
                          : "border-line text-faint hover:text-[#F4F1EC]"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path d={icon.path} fill="currentColor" />
                      </svg>
                    </button>
                  ))}
                </div>
                <label className="label">Oder eigenes Icon hochladen</label>
                <ImageUpload kind="icon" value={d.stampIconImage} onChange={(url) => setDesign("stampIconImage", url)} />
              </div>
            )}

            <div className="pt-2 border-t border-white/[0.06]">
              <Field
                label="Logo-Buchstabe (Fallback ohne Bild)"
                maxLength={2}
                value={d.logo}
                onChange={(e) => setDesign("logo", e.target.value.toUpperCase())}
              />
              <div className="mt-4">
                <label className="label">Logo hochladen</label>
                <ImageUpload
                  kind="logo"
                  value={d.logoImage}
                  onChange={(url) => setDesign("logoImage", url)}
                />
              </div>
              {hasLogo && (
                <div className="grid gap-4 md:grid-cols-3 mt-4">
                  <Slider label="Größe" value={d.logoScale} min={0.6} max={1.6} step={0.05} onChange={(v) => setDesign("logoScale", v)} format={(v) => `${Math.round(v * 100)}%`} />
                  <Slider label="Horizontal" value={d.logoOffsetX} min={-15} max={15} onChange={(v) => setDesign("logoOffsetX", v)} />
                  <Slider label="Vertikal" value={d.logoOffsetY} min={-15} max={15} onChange={(v) => setDesign("logoOffsetY", v)} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Belohnung */}
        {step === 2 && (
          <div className="space-y-4 enter">
            <Field
              label="Belohnung"
              value={input.rewardDescription}
              onChange={(e) => set("rewardDescription", e.target.value)}
              placeholder="1 Gratis-Kaffee"
              hint='Kurz und konkret, z. B. "1 Gratis-Kaffee" oder "10% Rabatt auf den nächsten Einkauf".'
            />

            <div className="pt-4 border-t border-white/[0.06]">
              <label className="label">Wie werden {input.type === "stamp" ? "Stempel" : "Punkte"} vergeben?</label>
              <div className="text-xs text-faint mb-3">
                Beim manuellen Weg entscheidet dein Personal frei. Bei der automatischen Regel gibt dein Personal beim
                Scannen einfach den Einkaufsbetrag ein, {input.type === "stamp" ? "der Stempel" : "die Punkte"} werden dann
                automatisch berechnet.
              </div>
              <div className="inline-flex flex-wrap bg-ink border border-line rounded-xl p-1 gap-1 mb-4">
                {(["manual", "amount"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set("earningMode", m)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      input.earningMode === m ? "bg-white/[0.08] text-[#F4F1EC]" : "text-faint hover:text-[#F4F1EC]"
                    }`}
                  >
                    {m === "manual" ? "Manuell" : "Nach Einkaufsbetrag"}
                  </button>
                ))}
              </div>

              {input.earningMode === "amount" && input.type === "stamp" && (
                <Field
                  label="Mindestbetrag für einen Stempel (€)"
                  type="number"
                  min={0.01}
                  step={0.5}
                  value={input.minPurchaseAmount ?? ""}
                  onChange={(e) => set("minPurchaseAmount", Number(e.target.value) || null)}
                  placeholder="5"
                  hint='Z. B. "5" → ab 5 € Einkauf gibt es 1 Stempel, darunter keinen.'
                />
              )}
              {input.earningMode === "amount" && input.type === "points" && (
                <Field
                  label="Betrag pro Punkt (€)"
                  type="number"
                  min={0.01}
                  step={0.5}
                  value={input.amountPerPoint ?? ""}
                  onChange={(e) => set("amountPerPoint", Number(e.target.value) || null)}
                  placeholder="10"
                  hint='Z. B. "10" → 1 Punkt je 10 € Einkauf (23 € = 2 Punkte, abgerundet).'
                />
              )}
            </div>
          </div>
        )}

        {/* Step 3: Überprüfen */}
        {step === 3 && (
          <div className="space-y-3 enter">
            <div className="text-sm text-[#F4F1EC] font-semibold mb-2">Alles korrekt?</div>
            {[
              ["Programmname", input.name],
              ["Anzeigename", input.title],
              ["Typ", input.type === "stamp" ? "Stempelkarte" : "Punktekarte"],
              [input.type === "stamp" ? "Stempel bis Belohnung" : "Punkte bis Belohnung", input.type === "stamp" ? input.stampsRequired : input.pointsPerReward],
              ["Belohnung", input.rewardDescription],
              [
                "Vergabe",
                input.earningMode === "manual"
                  ? "Manuell durch Personal"
                  : input.type === "stamp"
                  ? `Automatisch ab ${(input.minPurchaseAmount ?? 0).toFixed(2)} € Einkauf`
                  : `Automatisch, 1 Punkt je ${(input.amountPerPoint ?? 0).toFixed(2)} € Einkauf`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm py-2 border-t border-white/[0.06] first:border-t-0">
                <span className="text-faint">{label}</span>
                <span className="text-[#F4F1EC] font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
          <button type="button" onClick={back} disabled={step === 0} className="btn btn-ghost text-sm">
            Zurück
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="btn btn-primary text-sm">
              Weiter
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={pending} className="btn btn-primary text-sm">
              {pending ? "Wird gespeichert…" : mode === "create" ? "Programm speichern" : "Änderungen speichern"}
            </button>
          )}
        </div>
      </div>

      {/* Live-Vorschau */}
      <div className="lg:sticky lg:top-8 self-start">
        <div className="text-xs text-faint uppercase tracking-wide text-center mb-4">
          So sieht’s im Handy deines Kunden aus
        </div>
        <div className="flex justify-center">
          <WalletCard
            title={input.title || "Dein Betrieb"}
            design={d}
            type={input.type}
            stamps={previewStamps}
            stampsRequired={input.stampsRequired}
            points={previewPoints}
            pointsPerReward={input.pointsPerReward}
            reward={input.rewardDescription || "Deine Belohnung"}
            serial="vorschau"
            qrDataUrl={qr ?? undefined}
          />
        </div>
        <div className="text-xs text-faint text-center mt-3">
          Vorschau · echter QR-Code entsteht beim Ausgeben einer Karte
        </div>
      </div>
    </div>
  );
}
