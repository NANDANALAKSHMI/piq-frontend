const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ProgressRing({ value, size = 116, label }) {
  const dash = (Math.max(0, Math.min(100, value)) / 100) * CIRCUMFERENCE;
  return (
    <svg width={size} height={size} viewBox="0 0 116 116" role="img" aria-label={label ?? `${value}% complete`} className="shrink-0">
      <circle cx="58" cy="58" r={RADIUS} fill="none" stroke="#EEF1F5" strokeWidth="12" />
      <circle
        cx="58"
        cy="58"
        r={RADIUS}
        fill="none"
        stroke={value >= 100 ? '#16A34A' : '#F28C28'}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
        transform="rotate(-90 58 58)"
        className="transition-[stroke-dasharray] duration-500"
      />
      <text x="58" y="64" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0F172A">
        {value}%
      </text>
    </svg>
  );
}
