/** Shared Recharts tooltip so every chart looks the same. */
export default function ChartTooltip({ active, payload, label, unit = 'jobs' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey ?? entry.name} className="flex items-center gap-2 text-muted">
          <span className="size-2 rounded-sm" style={{ background: entry.color ?? entry.payload?.fill }} aria-hidden="true" />
          {entry.name}: <span className="font-semibold text-ink">{entry.value} {unit}</span>
        </p>
      ))}
    </div>
  );
}
