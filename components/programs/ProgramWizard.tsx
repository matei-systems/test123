"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import QRCode from "qrcode";
import WalletCard from "@/components/WalletCard";
import LogoUpload from "@/components/programs/LogoUpload";
import { THEMES, themeGradient } from "@/lib/themes";
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
      theme: 0,
      logo: "C",
      logoImage: null,
    }
  );

  function set<K extends keyof ProgramInput>(key: K, value: ProgramInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="card p-6 md:p-8">
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
              <div className="inline-flex bg-ink border border-line rounded-xl p-1 gap-1">
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
                max={20}
                value={input.stampsRequired}
                onChange={(e) => set("stampsRequired", Number(e.target.value) || 10)}
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
          <div className="space-y-6 enter">
            <div>
              <label className="label">Kartenfarbe</label>
              <div className="flex gap-3 flex-wrap">
                {THEMES.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => set("theme", i)}
                    className={`w-10 h-10 rounded-lg transition-transform hover:scale-105 ${
                      input.theme === i ? "ring-2 ring-gold ring-offset-2 ring-offset-[#16131A]" : ""
                    }`}
                    style={{ background: themeGradient(i) }}
                    title={t.name}
                    aria-label={t.name}
                  />
                ))}
              </div>
            </div>
            <Field
              label="Logo-Buchstabe (Fallback ohne Upload)"
              maxLength={2}
              value={input.logo}
              onChange={(e) => set("logo", e.target.value.toUpperCase())}
            />
            <div>
              <label className="label">Logo hochladen</label>
              <LogoUpload value={input.logoImage} onChange={(v) => set("logoImage", v)} />
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
            logo={input.logo || "C"}
            logoImage={input.logoImage}
            theme={input.theme}
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
