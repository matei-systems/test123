"use client";

import { useState } from "react";
import ImageUpload from "@/components/programs/ImageUpload";
import SubmitButton from "@/components/SubmitButton";
import { CATEGORIES, WEEKDAYS, normalizeHours } from "@/lib/directory";
import { saveProfile } from "@/app/dashboard/profil/actions";

export interface ProfileFormValues {
  display_name: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  logo_url: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  public_email: string | null;
  instagram: string | null;
  opening_hours: unknown;
  hours_note: string | null;
}

export default function ProfileForm({ initial, canEdit, canSubmit }: { initial: ProfileFormValues; canEdit: boolean; canSubmit: boolean }) {
  const [logo, setLogo] = useState<string | null>(initial.logo_url);
  const [descLen, setDescLen] = useState((initial.description ?? "").length);
  const hours = normalizeHours(initial.opening_hours);
  const [closed, setClosed] = useState<boolean[]>(hours.map((h) => h.closed));

  return (
    <form action={saveProfile} className="space-y-6">
      <fieldset disabled={!canEdit} className="space-y-6 disabled:opacity-70">
        <section className="card p-6">
          <h2 className="font-display text-xl font-semibold">Auftritt</h2>
          <div className="mt-4 space-y-4">
            <div>
              <span className="label">Logo</span>
              <ImageUpload value={logo} onChange={(url) => setLogo(url)} kind="logo" />
              <input type="hidden" name="logo_url" value={logo ?? ""} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="display_name" className="label">Name des Geschäfts *</label>
                <input id="display_name" name="display_name" className="input" defaultValue={initial.display_name} required maxLength={80} />
              </div>
              <div>
                <label htmlFor="category" className="label">Kategorie *</label>
                <select id="category" name="category" className="input" defaultValue={initial.category ?? ""}>
                  <option value="">Bitte wählen</option>
                  {Object.entries(CATEGORIES).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="tagline" className="label">Kurzbeschreibung (eine Zeile)</label>
              <input id="tagline" name="tagline" className="input" defaultValue={initial.tagline ?? ""} maxLength={120} placeholder="z. B. Hausgemachte Kuchen und Kaffee aus eigener Röstung" />
            </div>
            <div>
              <label htmlFor="description" className="label">Beschreibung * (mind. 20 Zeichen)</label>
              <textarea
                id="description"
                name="description"
                className="input min-h-[140px]"
                defaultValue={initial.description ?? ""}
                maxLength={1500}
                onChange={(e) => setDescLen(e.target.value.length)}
                aria-describedby="desc-count"
              />
              <p id="desc-count" className={`hint ${descLen > 0 && descLen < 20 ? "!text-danger" : ""}`}>
                {descLen} / 1500 Zeichen
              </p>
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-display text-xl font-semibold">Standort & Kontakt</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr_1.4fr]">
            <div>
              <label htmlFor="address" className="label">Straße und Hausnummer</label>
              <input id="address" name="address" className="input" defaultValue={initial.address ?? ""} maxLength={160} autoComplete="street-address" />
            </div>
            <div>
              <label htmlFor="postal_code" className="label">PLZ</label>
              <input id="postal_code" name="postal_code" className="input" defaultValue={initial.postal_code ?? ""} maxLength={12} inputMode="numeric" autoComplete="postal-code" />
            </div>
            <div>
              <label htmlFor="city" className="label">Ort *</label>
              <input id="city" name="city" className="input" defaultValue={initial.city ?? ""} maxLength={80} autoComplete="address-level2" />
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="label">Telefon (öffentlich)</label>
              <input id="phone" name="phone" className="input" defaultValue={initial.phone ?? ""} maxLength={40} inputMode="tel" />
            </div>
            <div>
              <label htmlFor="public_email" className="label">E-Mail (öffentlich)</label>
              <input id="public_email" name="public_email" type="email" className="input" defaultValue={initial.public_email ?? ""} maxLength={200} />
            </div>
            <div>
              <label htmlFor="website" className="label">Website</label>
              <input id="website" name="website" className="input" defaultValue={initial.website ?? ""} maxLength={200} placeholder="https://" inputMode="url" />
            </div>
            <div>
              <label htmlFor="instagram" className="label">Instagram</label>
              <input id="instagram" name="instagram" className="input" defaultValue={initial.instagram ?? ""} maxLength={80} placeholder="@deingeschaeft" />
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-display text-xl font-semibold">Öffnungszeiten</h2>
          <div className="mt-4 divide-y divide-line">
            {WEEKDAYS.map((name, day) => (
              <div key={name} className="grid grid-cols-[1fr_auto] items-center gap-3 py-2.5 sm:grid-cols-[140px_1fr_auto]">
                <span className="font-medium">{name}</span>
                <div className={`col-span-2 flex items-center gap-2 sm:col-span-1 ${closed[day] ? "opacity-40" : ""}`}>
                  <label className="sr-only" htmlFor={`open_${day}`}>{name} von</label>
                  <input id={`open_${day}`} name={`open_${day}`} type="time" className="input !min-h-[40px] max-w-[130px]" defaultValue={hours[day].open ?? "09:00"} disabled={closed[day]} />
                  <span className="text-muted">–</span>
                  <label className="sr-only" htmlFor={`close_${day}`}>{name} bis</label>
                  <input id={`close_${day}`} name={`close_${day}`} type="time" className="input !min-h-[40px] max-w-[130px]" defaultValue={hours[day].close ?? "18:00"} disabled={closed[day]} />
                </div>
                <label className="row-start-1 flex items-center justify-end gap-2 text-sm text-muted sm:col-start-3">
                  <input
                    type="checkbox"
                    name={`closed_${day}`}
                    checked={closed[day]}
                    onChange={(e) => setClosed((c) => c.map((v, i) => (i === day ? e.target.checked : v)))}
                    className="h-4 w-4 accent-[rgb(var(--accent-strong))]"
                  />
                  geschlossen
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label htmlFor="hours_note" className="label">Hinweis zu den Öffnungszeiten</label>
            <input id="hours_note" name="hours_note" className="input" defaultValue={initial.hours_note ?? ""} maxLength={200} placeholder="z. B. An Feiertagen geschlossen" />
          </div>
        </section>
      </fieldset>

      {canEdit ? (
        <div className="sticky bottom-4 z-10 flex flex-wrap gap-3 rounded-full border border-line bg-surface/95 p-2 shadow-lift backdrop-blur">
          <SubmitButton className="btn btn-dark" pendingText="Speichern …">
            Speichern
          </SubmitButton>
          {canSubmit && (
            <button type="submit" name="intent" value="submit" className="btn btn-primary">
              Speichern & zur Prüfung einreichen
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-faint">Nur Inhaber und Admins können das Profil bearbeiten.</p>
      )}
    </form>
  );
}
