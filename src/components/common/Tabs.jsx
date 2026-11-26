import { cn } from '../../utils/formatters.js';

/** Underlined tabs. `tabs` = [{ id, label }]. */
export default function Tabs({ tabs, active, onChange, className, label = 'Sections' }) {
  return (
    <div role="tablist" aria-label={label} className={cn('scrollbar-thin flex gap-1 overflow-x-auto border-b border-line', className)}>
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm transition-colors',
              selected ? 'border-brand font-semibold text-ink' : 'border-transparent font-medium text-muted hover:text-ink',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** Rounded chip used for quick filters and presets. */
export function Chip({ active, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium transition-colors',
        active ? 'border-navy bg-navy text-white' : 'border-line bg-surface text-ink hover:border-slate-300',
        className,
      )}
    >
      {children}
    </button>
  );
}
