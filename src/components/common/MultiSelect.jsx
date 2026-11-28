import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside.js';
import SearchInput from './SearchInput.jsx';
import { cn } from '../../utils/formatters.js';

/**
 * Searchable multi-select with the chosen items shown as removable chips under the field.
 * `options` = [{ value, label, hint? }], `value` = array of selected values.
 */
export default function MultiSelect({ label, required, options, value, onChange, placeholder = 'Select…', emptyText = 'Nothing to choose from yet.', error, hint, disabled, className }) {
  const id = useId();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);
  useClickOutside(ref, close, open);

  const selected = useMemo(() => options.filter((o) => value.includes(o.value)), [options, value]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const toggle = (optionValue) => onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-muted">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </label>
      )}
      <div ref={ref} className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => (open ? close() : setOpen(true))}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-[10px] border bg-surface px-3 text-left text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:bg-slate-50',
            error ? 'border-red-400' : 'border-line',
          )}
        >
          <span className={cn('truncate', !selected.length && 'text-slate-400')}>
            {selected.length ? selected.map((o) => o.label).join(', ') : placeholder}
          </span>
          <ChevronDown className={cn('size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>

        {open && (
          <div className="absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
            {options.length > 6 && (
              <div className="border-b border-line p-2">
                <SearchInput value={query} onChange={setQuery} placeholder="Search" />
              </div>
            )}
            <ul role="listbox" aria-multiselectable="true" aria-label={label} className="scrollbar-thin max-h-64 overflow-y-auto p-1.5">
              {visible.map((option) => {
                const checked = value.includes(option.value);
                return (
                  <li key={option.value} role="option" aria-selected={checked}>
                    <button
                      type="button"
                      onClick={() => toggle(option.value)}
                      className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm', checked ? 'bg-brand-soft' : 'hover:bg-slate-50')}
                    >
                      <span
                        className={cn(
                          'grid size-4.5 shrink-0 place-items-center rounded border',
                          checked ? 'border-navy bg-navy text-white dark:border-brand dark:bg-brand dark:text-on-gold' : 'border-slate-300 bg-surface text-transparent',
                        )}
                      >
                        <Check className="size-3" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{option.label}</span>
                        {option.hint && <span className="block truncate text-xs text-muted">{option.hint}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
              {visible.length === 0 && <li className="px-2.5 py-3 text-[13px] text-muted">{options.length ? 'No matches.' : emptyText}</li>}
            </ul>
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={`Selected ${label?.toLowerCase() ?? 'items'}`}>
          {selected.map((option) => (
            <li key={option.value} className="inline-flex items-center gap-1 rounded-full bg-navy py-1 pl-3 pr-1 text-[13px] font-medium text-white dark:bg-navy-3">
              {option.label}
              <button
                type="button"
                onClick={() => toggle(option.value)}
                disabled={disabled}
                className="grid size-5 place-items-center rounded-full hover:bg-white/20"
                aria-label={`Remove ${option.label}`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
