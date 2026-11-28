import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside.js';
import useDropdownPlacement from '../../hooks/useDropdownPlacement.js';
import { cn } from '../../utils/formatters.js';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';

/** Muted avatar tones (white letters stay readable on each). Picked from the person's id so it never changes. */
const AVATAR_TONES = ['#0f766e', '#7a5a35', '#4a5f7e', '#6b4f7a', '#5d6b3a', '#7a4545'];
function toneFor(id = '') {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function Initial({ person, size }) {
  return (
    <span
      aria-hidden="true"
      className={cn('grid shrink-0 place-items-center rounded-full font-bold text-white', size === 'sm' ? 'size-7 text-xs' : 'size-8 text-[13px]')}
      style={{ background: toneFor(person.id) }}
    >
      {person.name?.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

const roleOf = (person) => person.title || person.role || 'Team member';

/**
 * "Assigned people": pick any number of team members. Chosen people show as chips inside the field;
 * "+ Add people" opens a searchable list with a checkbox per person.
 * `people` = [{ id, name, title?, role? }], `value` = array of ids.
 */
export default function PeoplePicker({ people, value, onChange, label = 'Assigned people', hint, className }) {
  const id = useId();
  const ref = useRef(null);
  const addRef = useRef(null);
  const fieldRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    setQuery('');
    if (returnFocus) addRef.current?.focus();
  }, []);
  const closeQuietly = useCallback(() => close(false), [close]);
  useClickOutside(ref, closeQuietly, open);
  const { panelRef, maxHeight } = useDropdownPlacement(fieldRef, open);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const selected = value.map((pid) => byId.get(pid)).filter(Boolean);

  const q = query.trim().toLowerCase();
  const visible = q ? people.filter((p) => `${p.name} ${roleOf(p)}`.toLowerCase().includes(q)) : people;

  const toggle = (pid) => onChange(value.includes(pid) ? value.filter((v) => v !== pid) : [...value, pid]);

  const onPanelKey = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const boxes = [...(listRef.current?.querySelectorAll('input[type="checkbox"]') ?? [])];
    if (!boxes.length) return;
    const index = boxes.indexOf(document.activeElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    boxes[index === -1 ? (step === 1 ? 0 : boxes.length - 1) : (index + step + boxes.length) % boxes.length].focus();
  };

  const addButton = (
    <button
      ref={addRef}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? `${id}-panel` : undefined}
      onClick={() => (open ? close() : setOpen(true))}
      className={cn(
        'hit-44 inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-gold px-3 text-[13px] font-semibold text-gold transition-colors hover:bg-gold/10',
        FOCUS,
      )}
    >
      <Plus className="size-3.5" aria-hidden="true" />
      Add people
    </button>
  );

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span id={`${id}-label`} className="text-xs font-semibold text-muted">
        {label}
      </span>

      <div ref={ref} className="relative">
        {/* The field: chips + "Add people". Gold border while open or while anything inside has focus. */}
        <div
          ref={fieldRef}
          role="group"
          aria-labelledby={`${id}-label`}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(
            'flex min-h-[52px] flex-wrap items-center gap-2 rounded-[10px] border bg-field p-2 transition-colors',
            open ? 'border-gold ring-[0.5px] ring-gold' : 'border-panel-line focus-within:border-gold focus-within:ring-[0.5px] focus-within:ring-gold',
          )}
        >
          {selected.length === 0 && <span className="px-1.5 text-[13px] text-muted">No one assigned yet</span>}
          {selected.map((person) => (
            <span key={person.id} className="inline-flex h-9 items-center gap-2 rounded-full border border-panel-line bg-field py-0 pl-1 pr-1 text-[13px] text-ink">
              <Initial person={person} size="sm" />
              <span className="max-w-40 truncate">{person.name}</span>
              <button
                type="button"
                onClick={() => toggle(person.id)}
                aria-label={`Remove ${person.name}`}
                className={cn('hit-44 grid size-6 place-items-center rounded-full text-muted hover:bg-slate-100 hover:text-ink', FOCUS)}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
          {addButton}
        </div>

        {open && (
          <div
            id={`${id}-panel`}
            role="dialog"
            aria-label="Add people"
            onKeyDown={onPanelKey}
            ref={panelRef}
            style={{ maxHeight }}
            className={cn(
              'absolute inset-x-0 top-full z-40 mt-1.5 flex scroll-mb-3 flex-col overflow-hidden rounded-xl border border-panel-line bg-panel shadow-[0_12px_32px_rgba(0,0,0,0.55)] sm:max-w-md',
            )}
          >
            <div className="shrink-0 border-b border-panel-line p-2.5">
              <label className="flex h-11 items-center gap-2 rounded-[10px] border border-panel-line bg-field px-3 text-muted focus-within:border-gold">
                <Search className="size-4 shrink-0" aria-hidden="true" />
                <span className="sr-only">Search team members</span>
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search team members"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
                />
              </label>
            </div>

            <ul ref={listRef} aria-label="Team members" className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
              {visible.map((person) => {
                const checked = value.includes(person.id);
                return (
                  <li key={person.id}>
                    <label
                      className={cn(
                        'flex min-h-[52px] cursor-pointer items-center gap-3 rounded-lg border bg-field px-3 py-2 transition-colors',
                        checked ? 'border-gold/50' : 'border-transparent hover:border-panel-line',
                      )}
                    >
                      <span className="relative grid size-5 shrink-0 place-items-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(person.id)}
                          className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-md border-[1.5px] border-check-line bg-transparent outline-none transition-colors checked:border-gold checked:bg-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                        />
                        {checked && <Check className="pointer-events-none relative size-3.5 text-on-gold" strokeWidth={3} aria-hidden="true" />}
                      </span>
                      <Initial person={person} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{person.name}</span>
                        <span className="block truncate text-xs text-muted">{roleOf(person)}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
              {visible.length === 0 && (
                <li className="px-3 py-4 text-[13px] text-muted">{people.length ? 'No one matches that search.' : 'No active team members yet.'}</li>
              )}
            </ul>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-panel-line px-3 py-2">
              <span className="text-[13px] text-muted" aria-live="polite">
                Pick everyone who will work on this project
              </span>
              <button
                type="button"
                onClick={() => close(true)}
                className={cn('h-11 rounded-lg bg-gold px-5 text-[13px] font-bold text-on-gold hover:bg-gold-hover', FOCUS)}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
