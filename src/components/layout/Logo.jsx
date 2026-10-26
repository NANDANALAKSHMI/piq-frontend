export function LogoMark({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" aria-hidden="true" className="shrink-0">
      <rect width="38" height="38" rx="10" fill="#F28C28" />
      <path
        d="M19 8.5l9.5 5.2v10.6L19 29.5l-9.5-5.2V13.7z M9.5 13.7l9.5 5.2 9.5-5.2 M19 18.9v10.6"
        fill="none"
        stroke="#0F1B33"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo() {
  return (
    <div className="flex items-center gap-3 px-2">
      <LogoMark />
      <div>
        <span className="block text-[22px] font-bold leading-none tracking-wide text-white">PIQ</span>
        <span className="mt-1 block text-[11px] text-navy-muted">Packaging &amp; Job Management</span>
      </div>
    </div>
  );
}
