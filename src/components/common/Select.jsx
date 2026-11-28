import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../utils/formatters.js';

const MAX_LIST_HEIGHT = 300;
/** Lists with more options than this get a search box automatically. */
const SEARCH_AFTER = 7;

/**
 * Themed replacement for the native <select> (whose popup can't be styled).
 * Same API: `value`, `options` (strings or { value, label }), `placeholder`, and `onChange`
 * which receives an event-like `{ target: { value, name } }`.
 * Long lists (more than 7 options) show a search box; pass `searchable` to force it on or off.
 */
export default function Select({
  options,
  placeholder,
  value = '',
  onChange,
  disabled,
  invalid,
  name,
  id,
  className = '',
  searchable,
  'aria-label': ariaLabel,
}) {
  const autoId = useId();
  const buttonId = id ?? autoId;
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [box, setBox] = useState(null);

  const items = useMemo(() => {
    const list = options.map((option) => (typeof option === 'string' ? { value: option, label: option } : { value: option.value, label: option.label }));
    return placeholder ? [{ value: '', label: placeholder, isPlaceholder: true }, ...list] : list;
  }, [options, placeholder]);

  const showSearch = searchable ?? options.length > SEARCH_AFTER;

  /** What the list shows: everything, or the options matching the search (names starting with it first). */
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    const matches = items.filter((item) => !item.isPlaceholder && String(item.label).toLowerCase().includes(q));
    const starts = matches.filter((item) => String(item.label).toLowerCase().startsWith(q));
    return [...starts, ...matches.filter((item) => !starts.includes(item))];
  }, [items, query]);

  const current = String(value ?? '');
  const selected = items.find((item) => String(item.value) === current) ?? null;
  const showingPlaceholder = !selected || selected.isPlaceholder;
  const hasWidth = /(^|\s)w-/.test(className);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const openList = () => {
    if (disabled) return;
    setActive(Math.max(items.findIndex((item) => String(item.value) === current), 0));
    setOpen(true);
  };

  const choose = (item) => {
    onChange?.({ target: { value: item.value, name } });
    close();
    buttonRef.current?.focus();
  };

  // Position the popup under (or above) the button; it is portalled so modals and scroll areas can't clip it.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const wanted = Math.min(MAX_LIST_HEIGHT, items.length * 40 + 12 + (showSearch ? 52 : 0));
      const flip = below < wanted && above > below;
      setBox({
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(140, Math.min(MAX_LIST_HEIGHT, flip ? above : below)),
        ...(flip ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, items.length, showSearch]);

  // Search box gets the focus when the list opens.
  useEffect(() => {
    if (open && box && showSearch) searchRef.current?.focus();
  }, [open, box, showSearch]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (buttonRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      close();
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation(); // don't also close a modal underneath
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, close]);

  // Keep the highlighted option in view while using the keyboard.
  useEffect(() => {
    if (open) panelRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, box]);

  /** Arrow keys, Home/End, Enter and Tab: shared by the button and the search box. Returns true when handled. */
  const navigate = (event) => {
    const { key } = event;
    if (key === 'ArrowDown') setActive((i) => Math.min(i + 1, visible.length - 1));
    else if (key === 'ArrowUp') setActive((i) => Math.max(i - 1, 0));
    else if (key === 'Home' && !showSearch) setActive(0);
    else if (key === 'End' && !showSearch) setActive(visible.length - 1);
    else if (key === 'Enter' || (key === ' ' && !showSearch)) {
      if (visible[active]) choose(visible[active]);
    } else if (key === 'Tab') {
      close();
      return true;
    } else return false;
    event.preventDefault();
    return true;
  };

  const onButtonKeyDown = (event) => {
    if (disabled) return;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    if (navigate(event) || event.key.length !== 1) return;
    // Plain list (no search box): type a letter to jump to the next option starting with it.
    const letter = event.key.toLowerCase();
    const from = visible.findIndex((item, index) => index > active && String(item.label).toLowerCase().startsWith(letter));
    const found = from >= 0 ? from : visible.findIndex((item) => String(item.label).toLowerCase().startsWith(letter));
    if (found >= 0) setActive(found);
  };

  return (
    <>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        name={name}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onButtonKeyDown}
        className={cn(
          'flex h-10 min-w-0 items-center justify-between gap-2 rounded-[10px] border bg-surface px-3 text-left text-sm text-ink outline-none transition-colors',
          'hover:border-brand-line focus-visible:border-brand disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted',
          open ? 'border-brand' : invalid ? 'border-red-400' : 'border-line',
          !hasWidth && 'w-full',
          className,
        )}
      >
        <span className={cn('truncate', showingPlaceholder && 'text-slate-400')}>{selected ? selected.label : placeholder ?? ''}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open &&
        box &&
        createPortal(
          <div
            ref={panelRef}
            onClick={(event) => event.stopPropagation()}
            style={{ position: 'fixed', zIndex: 100, minWidth: 140, ...box }}
            className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
          >
            {showSearch && (
              <div className="shrink-0 border-b border-line p-2">
                <label className="flex h-9 items-center gap-2 rounded-lg border border-line bg-field px-2.5 text-muted focus-within:border-brand">
                  <Search className="size-4 shrink-0" aria-hidden="true" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setActive(0);
                    }}
                    onKeyDown={navigate}
                    placeholder="Search"
                    aria-label={`Search ${ariaLabel ?? 'options'}`}
                    autoComplete="off"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
                  />
                </label>
              </div>
            )}
            <ul role="listbox" aria-label={ariaLabel} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-1.5">
              {visible.map((item, index) => {
                const isSelected = String(item.value) === current && !item.isPlaceholder;
                return (
                  <li
                    key={`${item.value}-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    data-index={index}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(item)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm',
                      item.isPlaceholder && 'text-muted',
                      index === active && 'bg-brand-soft',
                      isSelected && 'font-semibold text-brand-ink',
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {isSelected && <Check className="size-4 shrink-0" aria-hidden="true" />}
                  </li>
                );
              })}
              {visible.length === 0 && <li className="px-2.5 py-3 text-[13px] text-muted">No matches.</li>}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}
