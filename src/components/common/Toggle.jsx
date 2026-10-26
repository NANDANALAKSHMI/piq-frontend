import { cn } from '../../utils/formatters.js';

export default function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-green-700' : 'bg-slate-300',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left] duration-150',
          checked ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  );
}
