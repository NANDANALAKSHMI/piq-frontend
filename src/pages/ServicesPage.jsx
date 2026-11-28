import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Layers, Pencil, Plus, SearchX, TriangleAlert } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Toggle from '../components/common/Toggle.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { useToast } from '../components/common/Toast.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import useServices from '../hooks/useServices.js';

import { SERVICE_SURFACE, initialOf, serviceTone } from '../features/services/serviceTone.js';
import { cn } from '../utils/formatters.js';

const PAGE_SIZE = 12;

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';
const GRID = 'grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(270px,1fr))]';
const FILTERS = ['All', 'Active', 'Inactive'];

const SURFACE = SERVICE_SURFACE;

const ICON_BUTTON = cn('grid size-8 place-items-center rounded-lg transition-colors', FOCUS_RING);

/** Modern service card. Clicking anywhere opens the service; the switch and icons keep their own action. */
function ServiceCard({ service, onToggle, onEdit, onView }) {
  const subs = service.subServices;
  const extra = subs.length - 2;
  const open = (event) => {
    if (event.target.closest('a, button')) return;
    onView();
  };

  return (
    <li
      onClick={open}
      className={cn(
        SURFACE,
        'app-card-hover group flex cursor-pointer flex-col gap-3.5 p-4 text-ink',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn('grid size-10 shrink-0 place-items-center rounded-xl font-display text-base font-bold ring-1 ring-inset', serviceTone(service.name, service.active))}
          aria-hidden="true"
        >
          {initialOf(service.name)}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="truncate text-[15px] font-semibold leading-tight" title={service.name}>
            {service.name}
          </h2>
        </div>
        <Toggle size="sm" checked={service.active} label={`${service.name} active`} onChange={onToggle} />
      </div>

      {service.description && (
        <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-soft" title={service.description}>
          {service.description}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 border-t border-[#ebe2d4] pt-3 dark:border-white/[0.06]">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {subs.length ? (
            <>
              {subs.slice(0, 2).map((sub) => (
                <span
                  key={sub.id}
                  className={cn(
                    'max-w-[130px] truncate rounded-md bg-[#efe8dc] px-2 py-1 text-[11.5px] font-medium dark:bg-white/[0.06]',
                    sub.active ? 'text-ink-soft' : 'text-muted line-through',
                  )}
                >
                  {sub.name}
                </span>
              ))}
              {extra > 0 && <span className="rounded-md bg-brand-soft px-2 py-1 text-[11.5px] font-semibold text-brand-ink">+{extra}</span>}
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 py-1 text-xs text-muted">
              <Layers className="size-3.5" aria-hidden="true" />
              No sub-services yet
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${service.name}`}
            title="Edit service"
            className={cn(ICON_BUTTON, 'text-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-white/[0.07]')}
          >
            <Pencil className="size-[15px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onView}
            aria-label={`View ${service.name}`}
            title="View service"
            className={cn(ICON_BUTTON, 'bg-brand-soft text-brand-ink hover:bg-gold hover:text-on-gold')}
          >
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

function CardSkeleton() {
  return (
    <li className={cn(SURFACE, 'flex h-[132px] animate-pulse flex-col gap-3 p-4')} aria-hidden="true">
      <div className="flex gap-3">
        <span className="size-10 rounded-xl bg-slate-100 dark:bg-white/[0.06]" />
        <span className="flex flex-1 flex-col gap-2 pt-1">
          <span className="h-3.5 w-2/3 rounded bg-slate-100 dark:bg-white/[0.06]" />
          <span className="h-3 w-1/3 rounded bg-slate-100 dark:bg-white/[0.06]" />
        </span>
      </div>
      <span className="mt-auto h-6 w-1/2 rounded bg-slate-100 dark:bg-white/[0.06]" />
    </li>
  );
}

export default function ServicesPage() {
  const { services, loading, error, updateService } = useServices();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter(
      (s) =>
        (status === 'All' || s.active === (status === 'Active')) &&
        (!q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.subServices.some((sub) => sub.name.toLowerCase().includes(q))),
    );
  }, [services, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const run = async (action) => {
    try {
      return (await action()) ?? true;
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      return false;
    }
  };

  return (
    <div className="flex min-h-full flex-col gap-5.5">
      <PageHeader
        title="Services"
        subtitle="Everything you offer. Edit a service, or open it to see its sub-services and ongoing projects."
        actions={
          <Button variant="primary" icon={Plus} to="/services/new">
            Add service
          </Button>
        }
      />

      {error && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div className="text-[13px]">
            <p className="font-semibold text-amber-900">Services aren’t connected yet</p>
            <p className="mt-0.5 text-amber-800">{error}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Search services or sub-services"
          className="w-full border-[#e4d9c8] bg-[#fbf8f2] sm:w-[380px] dark:border-white/[0.08] dark:bg-white/[0.03]"
        />
        <div role="tablist" aria-label="Filter by status" className="inline-flex rounded-[10px] bg-segment p-1 dark:bg-white/[0.04]">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={status === value}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
              className={cn(
                'inline-flex h-8 items-center rounded-lg px-3.5 text-[13px] font-semibold transition-colors',
                FOCUS_RING,
                status === value ? 'bg-surface text-ink shadow-sm dark:bg-white/[0.09]' : 'text-muted hover:text-ink',
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <ul className={GRID} aria-busy="true" aria-label="Loading services">
          {[0, 1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </ul>
      )}

      {!loading && services.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No services yet"
          description="Add the first thing you offer, then its sub-services."
          action={
            <Button variant="primary" icon={Plus} to="/services/new">
              Add service
            </Button>
          }
        />
      )}

      {!loading && services.length > 0 && filtered.length === 0 && (
        <EmptyState icon={SearchX} title="No match" description="Try another name, or switch the status filter." />
      )}

      {!loading && shown.length > 0 && (
        <>
          <ul className={GRID} aria-label="Services">
            {shown.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onToggle={(active) => run(() => updateService(service.id, { active }))}
                onEdit={() => navigate(`/services/${service.id}/edit`)}
                onView={() => navigate(`/services/${service.id}`)}
              />
            ))}
          </ul>
          <Pagination className="mt-auto border-t border-line pt-4 dark:border-white/[0.06]" page={page} pageCount={pageCount} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
