import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside.js';
import { PROJECT_STATUSES } from '../../data/constants.js';
import { cn } from '../../utils/formatters.js';

/**
 * How each project status looks in lists. "In progress" is shown as "Ongoing".
 * The label always sits next to the colour, so colour is never the only signal.
 */
export const STATUS_META = {
  'In progress': { label: 'Ongoing', dot: 'bg-gold', pill: 'bg-brand-soft text-brand-ink' },
  Upcoming: { label: 'Upcoming', dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700' },
  'On hold': { label: 'On hold', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800' },
  Completed: { label: 'Completed', dot: 'bg-green-500', pill: 'bg-green-50 text-green-700' },
  Cancelled: { label: 'Cancelled', dot: 'bg-red-500', pill: 'bg-red-50 text-red-700' },
};

export const statusLabel = (status) => STATUS_META[status]?.label ?? status;

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';

/**
 * Clickable status badge that opens a small menu of every status.
 * Keyboard: Enter/Space/↓ opens, ↑/↓/Home/End move, Enter/Space picks, Esc or Tab closes.
 */
export default function StatusMenu({ status, onChange, disabled, label }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const itemRefs = useRef([]);
  const menuId = useId();
  const meta = STATUS_META[status] ?? { label: status, dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-700' };

  const close = useCallback((focusButton = false) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  }, []);
  const closeQuietly = useCallback(() => close(false), [close]);
  useClickOutside(ref, closeQuietly, open);

  useEffect(() => {
    if (open) itemRefs.current[active]?.focus();
  }, [open, active]);

  const openMenu = () => {
    setActive(Math.max(0, PROJECT_STATUSES.indexOf(status)));
    setOpen(true);
  };

  const pick = (next) => {
    close(true);
    if (next !== status) onChange(next);
  };

  const onMenuKey = (event) => {
    const last = PROJECT_STATUSES.length - 1;
    const moves = { ArrowDown: (i) => (i === last ? 0 : i + 1), ArrowUp: (i) => (i === 0 ? last : i - 1), Home: () => 0, End: () => last };
    if (moves[event.key]) {
      event.preventDefault();
      setActive(moves[event.key]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`${label ? `${label} status` : 'Status'}: ${meta.label}. Change status`}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            openMenu();
          }
        }}
        className={cn(
          'hit-44 inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full pl-2.5 pr-1.5 text-xs font-semibold transition-[filter] hover:brightness-110 disabled:cursor-wait disabled:opacity-70',
          meta.pill,
          FOCUS,
        )}
      >
        <span className={cn('size-2 rounded-full', meta.dot)} aria-hidden="true" />
        {meta.label}
        <ChevronDown className={cn('size-3.5 opacity-70 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <ul
          id={menuId}
          role="menu"
          aria-label="Change status"
          onKeyDown={onMenuKey}
          className="absolute right-0 top-full z-40 mt-1.5 w-48 xl:left-0 xl:right-auto rounded-xl border border-panel-line bg-panel p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
        >
          {PROJECT_STATUSES.map((value, index) => {
            const item = STATUS_META[value];
            const current = value === status;
            return (
              <li key={value} role="none">
                <button
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={current}
                  tabIndex={index === active ? 0 : -1}
                  onClick={() => pick(value)}
                  onFocus={() => setActive(index)}
                  className={cn(
                    'flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-medium text-ink hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold',
                    current && 'font-semibold',
                  )}
                >
                  <span className={cn('size-2.5 shrink-0 rounded-full', item.dot)} aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {current && <Check className="size-4 text-gold" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
