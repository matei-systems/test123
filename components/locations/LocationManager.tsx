"use client";

import { useState, useTransition } from "react";
import { createLocation, updateLocation, deleteLocation, type LocationInput } from "@/app/dashboard/locations/actions";

interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
}

const EMPTY: LocationInput = { name: "", address: "", city: "", postalCode: "" };

function LocationForm({
  initial,
  onCancel,
  onSaved,
  saveFn,
}: {
  initial: LocationInput;
  onCancel?: () => void;
  onSaved: (input: LocationInput, id?: string) => void;
  saveFn: (input: LocationInput) => Promise<{ error?: string; id?: string }>;
}) {
  const [input, setInput] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof LocationInput>(key: K, value: LocationInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveFn(input);
      if (res.error) {
        setError(res.error);
        return;
      }
      onSaved(input, res.id);
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      <input className="input" placeholder="Name (z. B. Filiale Innenstadt)" required value={input.name} onChange={(e) => set("name", e.target.value)} />
      <input className="input" placeholder="Adresse" value={input.address} onChange={(e) => set("address", e.target.value)} />
      <input className="input" placeholder="Stadt" value={input.city} onChange={(e) => set("city", e.target.value)} />
      <input className="input" placeholder="PLZ" value={input.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
      {error && <div className="text-xs text-[#FCA5A5] md:col-span-2">{error}</div>}
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary text-sm">
          {pending ? "Wird gespeichert…" : "Speichern"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-ghost text-sm">
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}

function LocationCard({ location, onRemoved }: { location: Location; onRemoved: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(location);

  if (editing) {
    return (
      <div className="card p-4">
        <LocationForm
          initial={{
            name: current.name,
            address: current.address ?? "",
            city: current.city ?? "",
            postalCode: current.postal_code ?? "",
          }}
          saveFn={(input) => updateLocation(current.id, input)}
          onCancel={() => setEditing(false)}
          onSaved={(input) => {
            setCurrent((prev) => ({ ...prev, name: input.name, address: input.address, city: input.city, postal_code: input.postalCode }));
            setEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="card p-4 flex items-center justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <div className="font-medium text-sm">{current.name}</div>
        {(current.address || current.city) && (
          <div className="text-xs text-[#A6A099]">{[current.address, current.postal_code, current.city].filter(Boolean).join(", ")}</div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button type="button" onClick={() => setEditing(true)} className="btn btn-ghost text-xs">
          Bearbeiten
        </button>
        {confirming ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await deleteLocation(current.id);
                  if (!res.error) onRemoved(current.id);
                })
              }
              className="btn text-xs"
              style={{ background: "rgba(239,68,68,0.15)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              {pending ? "…" : "Sicher?"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="btn btn-ghost text-xs">
              Abbrechen
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="btn btn-ghost text-xs">
            Löschen
          </button>
        )}
      </div>
    </div>
  );
}

export default function LocationManager({ locations }: { locations: Location[] }) {
  const [items, setItems] = useState(locations);
  const [showForm, setShowForm] = useState(items.length === 0);

  return (
    <div className="space-y-4">
      {showForm ? (
        <div className="card p-5">
          <LocationForm
            initial={EMPTY}
            saveFn={createLocation}
            onCancel={items.length > 0 ? () => setShowForm(false) : undefined}
            onSaved={(input, id) => {
              if (id) {
                setItems((prev) => [
                  ...prev,
                  { id, name: input.name, address: input.address || null, city: input.city || null, postal_code: input.postalCode || null },
                ]);
              }
              setShowForm(false);
            }}
          />
        </div>
      ) : (
        <button type="button" onClick={() => setShowForm(true)} className="btn btn-primary text-sm">
          + Neuer Standort
        </button>
      )}

      <div className="space-y-2">
        {items.map((l) => (
          <LocationCard key={l.id} location={l} onRemoved={(id) => setItems((prev) => prev.filter((x) => x.id !== id))} />
        ))}
        {items.length === 0 && <div className="text-[#6E685F] text-sm">Noch keine Standorte angelegt.</div>}
      </div>
    </div>
  );
}
