import { cn } from '../../utils/formatters.js';

const TONES = {
  brand: 'bg-brand',
  green: 'bg-green-600',
  red: 'bg-red-600',
  amber: 'bg-amber-500',
  blue: 'bg-blue-600',
};

/** Utilisation bars pass `auto` to colour by load: red ≥ 85%, green ≤ 45%. */
export default function ProgressBar({ value, tone = 'brand', size = 'sm', label, className }) {
  const clamped = Math.max(0, Math.min(100, value));
  let resolvedTone = tone;
  if (tone === 'auto') resolvedTone = clamped >= 85 ? 'red' : clamped <= 45 ? 'green' : 'brand';
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('min-w-12 overflow-hidden rounded-full bg-slate-100', size === 'sm' ? 'h-2' : 'h-2.5', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', TONES[resolvedTone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
