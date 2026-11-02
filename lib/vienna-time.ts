// Datumseingaben (YYYY-MM-DD) aus Formularen als Zeitpunkt in Europe/Vienna
// interpretieren - unabhängig von der Zeitzone des Servers (Vercel = UTC).
function viennaOffsetMinutes(at: Date): number {
  const label = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Vienna", timeZoneName: "shortOffset" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value; // z. B. "GMT+1"
  const m = label?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 60;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

export function viennaDateToIso(date: string | null | undefined, endOfDay = false): string | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const naive = new Date(`${date}T${endOfDay ? "23:59:59" : "00:00:00"}Z`);
  if (Number.isNaN(naive.getTime())) return null;
  return new Date(naive.getTime() - viennaOffsetMinutes(naive) * 60_000).toISOString();
}

export function viennaDateTimeToIso(value: string | null | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const naive = new Date(`${value}:00Z`);
  if (Number.isNaN(naive.getTime())) return null;
  return new Date(naive.getTime() - viennaOffsetMinutes(naive) * 60_000).toISOString();
}

// ISO-Zeitpunkt -> Wert für <input type="date"> bzw. "datetime-local" (Wien)
export function isoToViennaInput(iso: string | null | undefined, withTime = false): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Vienna",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso)); // "2026-11-02 18:30"
  return withTime ? parts.replace(" ", "T") : parts.slice(0, 10);
}
