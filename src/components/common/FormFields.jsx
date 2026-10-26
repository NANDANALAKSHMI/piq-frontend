import { useId } from 'react';
import { cn } from '../../utils/formatters.js';

const CONTROL =
  'min-w-0 rounded-[10px] border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand disabled:bg-slate-50';

function FieldShell({ id, label, hint, error, required, className, children }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-muted">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-700">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

export function TextField({ label, hint, error, required, className, inputClassName, ...props }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input id={id} className={cn(CONTROL, 'h-10 w-full', error && 'border-red-400', inputClassName)} aria-invalid={Boolean(error)} {...props} />
    </FieldShell>
  );
}

export function TextArea({ label, hint, error, required, className, rows = 3, ...props }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea id={id} rows={rows} className={cn(CONTROL, 'w-full resize-y py-2.5 leading-relaxed', error && 'border-red-400')} {...props} />
    </FieldShell>
  );
}

/** `options` is an array of strings or { value, label }. */
export function SelectField({ label, hint, error, required, className, options, placeholder, ...props }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <SelectControl id={id} options={options} placeholder={placeholder} invalid={Boolean(error)} {...props} />
    </FieldShell>
  );
}

/**
 * Bare select for filter bars; pass `aria-label` when there's no visible label.
 * Fills its container unless `className` sets its own width (e.g. `w-auto`).
 */
export function SelectControl({ options, placeholder, invalid, className = '', ...props }) {
  const hasWidth = /(^|\s)w-/.test(className);
  return (
    <select className={cn(CONTROL, 'h-10 cursor-pointer pr-8', !hasWidth && 'w-full', invalid && 'border-red-400', className)} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value;
        const text = typeof option === 'string' ? option : option.label;
        return (
          <option key={value} value={value}>
            {text}
          </option>
        );
      })}
    </select>
  );
}

export function Checkbox({ label, className, ...props }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-[13px]', className)}>
      <input type="checkbox" className="size-4 cursor-pointer accent-navy" {...props} />
      {label}
    </label>
  );
}
