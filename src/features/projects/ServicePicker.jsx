import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Minus, Search, X } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside.js';
import useDropdownPlacement from '../../hooks/useDropdownPlacement.js';
import { cn } from '../../utils/formatters.js';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';

/** Gold checkbox (dark tick) built on a real <input>, so Space, labels and indeterminate work natively. */
function Checkbox({ checked, indeterminate = false, onChange, label, className, inputProps }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const on = checked || indeterminate;
  return (
    <span className={cn('relative grid size-[18px] shrink-0 place-items-center', className)}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-[5px] border border-slate-300 bg-transparent outline-none transition-colors checked:border-gold checked:bg-gold indeterminate:border-gold indeterminate:bg-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        {...inputProps}
      />
      {on && (
        <span className="pointer-events-none relative text-on-gold" aria-hidden="true">
          {indeterminate ? <Minus className="size-3.5" strokeWidth={3} /> : <Check className="size-3.5" strokeWidth={3} />}
        </span>
      )}
    </span>
  );
}

/**
 * Searchable services dropdown: each service with its sub-services as indented checkboxes.
 * Checking a service checks all its sub-services; unchecking clears them; some checked = partial.
 * `value` = { serviceIds, subServiceIds }, `onChange` gets the same shape back.
 */
export default function ServicePicker({ services, value, onChange, loading, error, className }) {
  const id = useId();
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});

  const { serviceIds, subServiceIds } = value;
  const subsOf = useCallback((service) => service.subServices.filter((sub) => sub.active), []);

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    setQuery('');
    if (returnFocus) triggerRef.current?.focus();
  }, []);
  const closeQuietly = useCallback(() => close(false), [close]);
  useClickOutside(ref, closeQuietly, open);
  const { panelRef, maxHeight } = useDropdownPlacement(triggerRef, open);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  /* ---------- selection rules ---------- */
  const stateOf = (service) => {
    const subs = subsOf(service);
    const selected = serviceIds.includes(service.id);
    if (!selected) return { checked: false, partial: false };
    if (!subs.length) return { checked: true, partial: false };
    const picked = subs.filter((sub) => subServiceIds.includes(sub.id)).length;
    return { checked: picked === subs.length, partial: picked < subs.length };
  };

  const toggleService = (service) => {
    const subIds = subsOf(service).map((sub) => sub.id);
    const { checked } = stateOf(service);
    if (checked) {
      onChange({ serviceIds: serviceIds.filter((sid) => sid !== service.id), subServiceIds: subServiceIds.filter((sid) => !subIds.includes(sid)) });
    } else {
      onChange({
        serviceIds: serviceIds.includes(service.id) ? serviceIds : [...serviceIds, service.id],
        subServiceIds: [...new Set([...subServiceIds, ...subIds])],
      });
    }
  };

  const toggleSub = (service, sub) => {
    if (subServiceIds.includes(sub.id)) {
      const remaining = subServiceIds.filter((sid) => sid !== sub.id);
      const anyLeft = subsOf(service).some((s) => remaining.includes(s.id));
      onChange({ serviceIds: anyLeft ? serviceIds : serviceIds.filter((sid) => sid !== service.id), subServiceIds: remaining });
    } else {
      onChange({
        serviceIds: serviceIds.includes(service.id) ? serviceIds : [...serviceIds, service.id],
        subServiceIds: [...subServiceIds, sub.id],
      });
    }
  };

  const removeService = (service) => {
    const subIds = service.subServices.map((sub) => sub.id);
    onChange({ serviceIds: serviceIds.filter((sid) => sid !== service.id), subServiceIds: subServiceIds.filter((sid) => !subIds.includes(sid)) });
  };

  const clearAll = () => onChange({ serviceIds: [], subServiceIds: [] });

  /* ---------- chips: "service: sub" per picked sub-service, or the service on its own ---------- */
  const chips = useMemo(
    () =>
      services
        .filter((service) => serviceIds.includes(service.id))
        .flatMap((service) => {
          const picked = service.subServices.filter((sub) => sub.active && subServiceIds.includes(sub.id));
          return picked.length
            ? picked.map((sub) => ({ key: sub.id, label: `${service.name}: ${sub.name}`, service, sub }))
            : [{ key: service.id, label: service.name, service }];
        }),
    [services, serviceIds, subServiceIds],
  );

  /* ---------- search: a service matches by its name, or shows only the sub-services that match ---------- */
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      services
        .map((service) => {
          const subs = service.subServices.filter((sub) => sub.active);
          if (!q || service.name.toLowerCase().includes(q)) return { service, subs };
          const matching = subs.filter((sub) => sub.name.toLowerCase().includes(q));
          return matching.length ? { service, subs: matching } : null;
        })
        .filter(Boolean),
    [services, q],
  );
  const isOpenRow = (serviceId) => Boolean(q) || Boolean(expanded[serviceId]);

  /* ---------- keyboard: ↑/↓ move between checkboxes, →/← expand/collapse, Esc closes ---------- */
  const onPanelKey = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(event.key)) return;
    const boxes = [...(listRef.current?.querySelectorAll('input[type="checkbox"]') ?? [])];
    const index = boxes.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!boxes.length) return;
      if (index === -1) boxes[event.key === 'ArrowDown' ? 0 : boxes.length - 1].focus();
      else boxes[(index + (event.key === 'ArrowDown' ? 1 : -1) + boxes.length) % boxes.length].focus();
      return;
    }
    const serviceId = document.activeElement?.dataset?.serviceRow;
    if (index !== -1 && serviceId) {
      event.preventDefault();
      setExpanded((current) => ({ ...current, [serviceId]: event.key === 'ArrowRight' }));
    }
  };

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-xs font-semibold text-muted">
        Services <span className="text-red-600">*</span>
      </label>

      <div ref={ref} className="relative">
        <button
          id={id}
          ref={triggerRef}
          type="button"
          disabled={loading}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={Boolean(error)}
          onClick={() => (open ? close() : setOpen(true))}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && !open) {
              event.preventDefault();
              setOpen(true);
            }
          }}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-[10px] border bg-surface px-3 text-left text-sm transition-colors hover:border-brand-line disabled:cursor-wait disabled:opacity-70',
            error ? 'border-red-400' : open ? 'border-gold' : 'border-line',
            FOCUS,
          )}
        >
          <span className={cn('truncate', !chips.length && 'text-muted')}>
            {loading ? 'Loading services…' : chips.length ? `${chips.length} selected` : 'Select services'}
          </span>
          <ChevronDown className={cn('size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Choose services"
            onKeyDown={onPanelKey}
            ref={panelRef}
            style={{ maxHeight }}
            className={cn(
              'absolute inset-x-0 top-full z-40 mt-1.5 flex scroll-mb-3 flex-col overflow-hidden rounded-xl border border-panel-line bg-panel shadow-[0_16px_40px_rgba(0,0,0,0.35)]',
            )}
          >
            <div className="shrink-0 border-b border-panel-line p-2.5">
              <label className="flex h-11 items-center gap-2 rounded-[10px] border border-panel-line bg-surface px-3 text-muted focus-within:border-gold">
                <Search className="size-4 shrink-0" aria-hidden="true" />
                <span className="sr-only">Search services</span>
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search services or sub-services"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
                />
              </label>
            </div>

            <ul ref={listRef} aria-label="Services" className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-1.5">
              {visible.map(({ service, subs }) => {
                const { checked, partial } = stateOf(service);
                const rowOpen = isOpenRow(service.id);
                const subsId = `${id}-${service.id}-subs`;
                return (
                  <li key={service.id}>
                    <div className="flex min-h-11 items-center gap-1 rounded-lg hover:bg-slate-50">
                      {subs.length ? (
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-expanded={rowOpen}
                          aria-controls={subsId}
                          aria-label={`${rowOpen ? 'Collapse' : 'Expand'} ${service.name}`}
                          onClick={() => setExpanded((current) => ({ ...current, [service.id]: !rowOpen }))}
                          className={cn('grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:text-ink', FOCUS)}
                        >
                          <ChevronRight className={cn('size-4 transition-transform', rowOpen && 'rotate-90')} aria-hidden="true" />
                        </button>
                      ) : (
                        <span className="size-11 shrink-0" aria-hidden="true" />
                      )}
                      <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 pr-2.5">
                        <Checkbox
                          checked={checked}
                          indeterminate={partial}
                          onChange={() => toggleService(service)}
                          inputProps={{ 'data-service-row': service.id, 'aria-describedby': subs.length ? subsId : undefined }}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{service.name}</span>
                          {subs.length > 0 && (
                            <span className="block truncate text-xs text-muted">
                              {subs.length} sub-service{subs.length === 1 ? '' : 's'}
                            </span>
                          )}
                        </span>
                      </label>
                    </div>
                    {subs.length > 0 && rowOpen && (
                      <ul id={subsId} aria-label={`${service.name} sub-services`} className="mb-1 ml-11 border-l border-panel-line pl-3">
                        {subs.map((sub) => (
                          <li key={sub.id}>
                            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-[13.5px] hover:bg-slate-50">
                              <Checkbox checked={subServiceIds.includes(sub.id)} onChange={() => toggleSub(service, sub)} />
                              <span className="truncate">{sub.name}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
              {visible.length === 0 && (
                <li className="px-3 py-4 text-[13px] text-muted">{services.length ? 'No services match.' : 'No services yet. Add them on the Services page.'}</li>
              )}
            </ul>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-panel-line px-3 py-2">
              <span className="text-[13px] text-muted" aria-live="polite">
                {chips.length} selected
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={!chips.length}
                  className={cn('h-11 rounded-lg px-3 text-[13px] font-semibold text-ink-soft hover:bg-slate-50 disabled:opacity-40', FOCUS)}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => close(true)}
                  className={cn('h-11 rounded-lg bg-gold px-4 text-[13px] font-bold text-on-gold hover:bg-gold-hover', FOCUS)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {chips.length > 0 && (
        <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Selected services">
          {chips.map((chip) => (
            <li
              key={chip.key}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-panel-line bg-panel py-0 pl-3 pr-1 text-[13px] text-ink"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => (chip.sub ? toggleSub(chip.service, chip.sub) : removeService(chip.service))}
                aria-label={`Remove ${chip.label}`}
                className={cn('hit-44 grid size-6 place-items-center rounded-full text-muted hover:bg-slate-100 hover:text-ink', FOCUS)}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
