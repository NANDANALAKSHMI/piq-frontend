import { STATUS_TONES } from '../../data/constants.js';
import { cn } from '../../utils/formatters.js';

const TONES = {
  blue: 'bg-blue-50 text-blue-700',
  sky: 'bg-sky-50 text-sky-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  violet: 'bg-violet-50 text-violet-700',
  orange: 'bg-brand-soft text-brand-ink',
  slate: 'bg-slate-100 text-slate-600',
  navy: 'bg-navy text-white',
};

export default function Badge({ tone = 'slate', dot = true, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none',
        TONES[tone] ?? TONES.slate,
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Badge whose colour comes from the shared status → tone map. */
export function StatusBadge({ value, dot = true, className }) {
  return (
    <Badge tone={STATUS_TONES[value] ?? 'slate'} dot={dot} className={className}>
      {value}
    </Badge>
  );
}

/** Small grey label for categories, scopes and skills. */
export function Tag({ children, className }) {
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700', className)}>
      {children}
    </span>
  );
}
