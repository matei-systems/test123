"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

interface CardRow {
  id: string;
  stamps: number;
  points: number;
  status: string;
  loyalty_programs: { id: string; title: string | null; name: string; type: "stamp" | "points"; stamps_required: number; points_per_reward: number } | null;
}

interface CustomerRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  cards: CardRow[];
}

function initials(name: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export default function CustomerList({ customers }: { customers: CustomerRow[] }) {
  const [query, setQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("all");

  const programs = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) =>
      c.cards.forEach((card) => {
        if (card.loyalty_programs) map.set(card.loyalty_programs.id, card.loyalty_programs.title ?? card.loyalty_programs.name);
      })
    );
    return Array.from(map.entries());
  }, [customers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (q) {
        const hay = `${c.full_name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (programFilter !== "all") {
        if (!c.cards.some((card) => card.loyalty_programs?.id === programFilter)) return false;
      }
      return true;
    });
  }, [customers, query, programFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Suche nach Name, E-Mail oder Telefon…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {programs.length > 0 && (
          <select className="input sm:w-56" value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
            <option value="all">Alle Programme</option>
            {programs.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-sm text-[#6E685F]">
          {customers.length === 0 ? "Noch keine Kunden." : "Keine Kunden gefunden."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c, i) => (
            <Link
              key={c.id}
              href={`/dashboard/customers/${c.id}`}
              className="card card-hover p-4 flex items-center gap-4 enter"
              style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-[rgba(232,181,115,0.14)] text-gold-bright grid place-items-center font-semibold text-sm shrink-0">
                {initials(c.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{c.full_name ?? "Kunde"}</div>
                <div className="text-xs text-[#A6A099] truncate">{c.email ?? c.phone ?? "Keine Kontaktdaten"}</div>
              </div>
              <div className="hidden md:flex gap-1.5 flex-wrap justify-end max-w-[45%]">
                {c.cards.slice(0, 3).map((card) => {
                  const p = card.loyalty_programs;
                  if (!p) return null;
                  const label =
                    p.type === "stamp" ? `${card.stamps}/${p.stamps_required}` : `${card.points}/${p.points_per_reward}`;
                  return (
                    <span
                      key={card.id}
                      className="text-[11px] px-2 py-1 rounded-full bg-white/[0.05] text-[#A6A099] whitespace-nowrap"
                    >
                      {p.title ?? p.name} · {label}
                    </span>
                  );
                })}
                {c.cards.length > 3 && (
                  <span className="text-[11px] px-2 py-1 rounded-full bg-white/[0.05] text-faint">+{c.cards.length - 3}</span>
                )}
                {c.cards.length === 0 && <span className="text-[11px] text-faint">Keine Karte</span>}
              </div>
              <div className="text-xs text-[#6E685F] shrink-0 hidden sm:block">
                {new Date(c.created_at).toLocaleDateString("de-AT")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
