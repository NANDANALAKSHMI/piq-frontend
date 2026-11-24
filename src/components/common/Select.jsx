import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/formatters.js';

const MAX_LIST_HEIGHT = 264;

/**
 * Themed replacement for the native <select> (whose popup can't be styled).
 * Same API: `value`, `options` (strings or { value, label }), `placeholder`, and `onChange`
 * which receives an event-like `{ target: { value, name } }`.
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
  'aria-label': ariaLabel,
}) {
  const autoId = useId();
  const buttonId = id ?? autoId;
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [box, setBox] = useState(null);

  const items = useMemo(() => {
    const list = options.map((option) => (typeof option === 'string' ? { value: option, label: option } : { value: option.value, label: option.label }));
    return placeholder ? [{ value: '', label: placeholder, isPlaceholder: true }, ...list] : list;
  }, [options, placeholder]);

  const current = String(value ?? '');
  const selectedIndex = items.findIndex((item) => String(item.value) === current);
  const selected = selectedIndex >= 0 ? items[selectedIndex] : null;
  const showingPlaceholder = !selected || selected.isPlaceholder;
  const hasWidth = /(^|\s)w-/.test(className);

  const close = useCallback(() => setOpen(false), []);

  const openList = () => {
    if (disabled) return;
    setActive(Math.max(selectedIndex, 0));
    setOpen(true);
  };

  const choose = (item) => {
    onChange?.({ target: { value: item.value, name } });
    setOpen(false);
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
      const flip = below < Math.min(MAX_LIST_HEIGHT, items.length * 40 + 12) && above > below;
      setBox({
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(120, Math.min(MAX_LIST_HEIGHT, flip ? above : below)),
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
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (buttonRef.current?.contains(event.target) || listRef.current?.contains(event.target)) return;
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
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, box]);

  const onKeyDown = (event) => {
    if (disabled) return;
    const { key } = event;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    if (key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (key === 'End') {
      event.preventDefault();
      setActive(items.length - 1);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (items[active]) choose(items[active]);
    } else if (key === 'Tab') {
      close();
    } else if (key.length === 1) {
      // Type-ahead: jump to the next option starting with the typed letter.
      const letter = key.toLowerCase();
      const from = items.findIndex((item, index) => index > active && String(item.label).toLowerCase().startsWith(letter));
      const found = from >= 0 ? from : items.findIndex((item) => String(item.label).toLowerCase().startsWith(letter));
      if (found >= 0) setActive(found);
    }
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
        onKeyDown={onKeyDown}
        className={cn(
          'flex h-10 min-w-0 items-center justify-between gap-2 rounded-[10px] border bg-white px-3 text-left text-sm text-ink outline-none transition-colors',
          'hover:border-brand-line focus-visible:border-brand disabled:cursor-not-allowed disabled:bg-[#f1ece3] disabled:text-muted',
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
          <ul
            ref={listRef}
            role="listbox"
            aria-label={ariaLabel}
            style={{ position: 'fixed', zIndex: 100, minWidth: 120, ...box }}
            className="scrollbar-thin overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-lg"
          >
            {items.map((item, index) => {
              const isSelected = index === selectedIndex;
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
                  {isSelected && !item.isPlaceholder && <Check className="size-4 shrink-0" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
