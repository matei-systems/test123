export default function StatTile({
  label,
  value,
  sublabel,
  tone = "default",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "default" | "good" | "warning" | "critical";
}) {
  const toneColor =
    tone === "good" ? "#86EFAC" : tone === "warning" ? "#E8B573" : tone === "critical" ? "#FCA5A5" : "#F4F1EC";
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-faint mb-2">{label}</div>
      <div className="text-2xl font-extrabold tracking-tight" style={{ color: toneColor }}>
        {value}
      </div>
      {sublabel && <div className="text-xs text-dim mt-1">{sublabel}</div>}
    </div>
  );
}
