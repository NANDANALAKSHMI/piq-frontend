import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MessageSquareText, Users } from 'lucide-react';
import SearchInput from '../common/SearchInput.jsx';
import useClickOutside from '../../hooks/useClickOutside.js';
import { useAppData } from '../../context/AppDataContext.jsx';

const MAX_PER_GROUP = 4;

/** Header search across jobs, clients and enquiries. Ctrl/⌘ + K focuses it. */
export default function GlobalSearch() {
  const { jobs, clients, enquiries } = useAppData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(wrapperRef, close, open);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const clientName = (id) => clients.find((c) => c.id === id)?.name ?? '';
    return [
      {
        label: 'Jobs',
        icon: Briefcase,
        items: jobs
          .filter((j) => `${j.id} ${j.name} ${clientName(j.clientId)}`.toLowerCase().includes(q))
          .slice(0, MAX_PER_GROUP)
          .map((j) => ({ id: j.id, title: `${j.id} · ${j.name}`, subtitle: clientName(j.clientId), to: `/jobs/${j.id}` })),
      },
      {
        label: 'Clients',
        icon: Users,
        items: clients
          .filter((c) => `${c.name} ${c.contactName} ${c.locations.map((l) => l.city).join(' ')}`.toLowerCase().includes(q))
          .slice(0, MAX_PER_GROUP)
          .map((c) => ({ id: c.id, title: c.name, subtitle: c.contactName, to: `/clients/${c.id}` })),
      },
      {
        label: 'Enquiries',
        icon: MessageSquareText,
        items: enquiries
          .filter((e) => `${e.id} ${e.company} ${e.contactName} ${e.city}`.toLowerCase().includes(q))
          .slice(0, MAX_PER_GROUP)
          .map((e) => ({ id: e.id, title: `${e.id} · ${e.company}`, subtitle: e.status, to: `/enquiries?selected=${e.id}` })),
      },
    ].filter((group) => group.items.length);
  }, [query, jobs, clients, enquiries]);

  const go = (to) => {
    navigate(to);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative min-w-0 flex-1 md:max-w-[480px]">
      <SearchInput
        inputRef={inputRef}
        value={query}
        onChange={(value) => {
          setQuery(value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && groups[0]) go(groups[0].items[0].to);
        }}
        placeholder="Search jobs, clients, enquiries…"
        label="Search PIQ"
        className="h-10.5 bg-canvas"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-white p-2 shadow-lg">
          {groups.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-muted">No results for “{query}”.</p>
          ) : (
            groups.map(({ label, icon: Icon, items }) => (
              <div key={label} className="py-1">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(item.to)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <Icon className="size-4 shrink-0 text-muted" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold">{item.title}</span>
                      <span className="block truncate text-xs text-muted">{item.subtitle}</span>
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
