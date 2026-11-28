import { cn } from '../../utils/formatters.js';

export default function Toggle({ checked, onChange, label, disabled, size = 'md' }) {
  const small = size === 'sm';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative shrink-0 rounded-full transition-colors disabled:opacity-50',
        small ? 'h-4 w-7' : 'h-6 w-11',
        checked ? 'bg-green-700 dark:bg-emerald-500' : 'bg-slate-300',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 rounded-full bg-white shadow-sm transition-[left] duration-150',
          small ? 'size-3' : 'size-5',
          checked ? (small ? 'left-3.5' : 'left-[22px]') : 'left-0.5',
        )}
      />
    </button>
  );
}
