import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Eye, MapPin, Pencil, Phone, Plus, SearchX, Users } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Pagination from '../components/common/Pagination.jsx';
import useServerSearch from '../hooks/useServerSearch.js';
import usePagination from '../hooks/usePagination.js';
import { useAppData } from '../context/AppDataContext.jsx';
import { cn } from '../utils/formatters.js';

const PAGE_SIZE = 8;

const place = (loc) => [loc?.city, loc?.district, loc?.state].filter(Boolean).join(', ');

/** Everything searchable about a client: name, contact, phone and its location. */
function searchText(client) {
  const places = client.locations.map((l) => `${l.address} ${l.city} ${l.district} ${l.state} ${l.pin}`).join(' ');
  return `${client.name} ${client.contactName} ${client.phone} ${client.email} ${places}`.toLowerCase();
}

const CARD = 'app-card rounded-xl border text-ink';
const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';
const GRID = 'grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]';

function ClientCard({ client }) {
  const contact = [client.contactName, client.phone].filter(Boolean).join(' · ');
  const location = place(client.locations[0]);
  const navigate = useNavigate();

  // Clicking anywhere on the card opens the client; the buttons inside keep their own action.
  // Keyboard users reach the same page through the View button.
  const openClient = (event) => {
    if (event.target.closest('a, button')) return;
    navigate(`/clients/${client.id}`);
  };

  return (
    <li
      onClick={openClient}
      className={cn(
        CARD,
        'app-card-hover flex min-h-20 cursor-pointer items-center gap-3 p-3',
      )}
    >
      <span
        className="grid size-11 shrink-0 place-items-center rounded-full bg-[#0f766e] text-base font-bold text-white w-[35px] h-[35px]"
        aria-hidden="true"
      >
        {client.name?.trim().charAt(0).toUpperCase() || '?'}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <b className="truncate text-[15px] font-bold leading-tight" title={client.name}>
          {client.name}
        </b>
        <p className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-ink-soft">
          <Phone className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{contact || '—'}</span>
        </p>
        <p className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{location || '—'}</span>
        </p>
      </div>

      <div className="flex shrink-0 gap-1.5 self-end">
        {/* There is no client edit screen yet, so this stays disabled until one exists. */}
        <button
          type="button"
          disabled
          aria-label={`Edit ${client.name}`}
          title="Editing clients isn't available yet"
          className={cn(
            'grid size-8 place-items-center rounded-lg border border-panel-line bg-transparent text-ink-soft transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent',
            FOCUS_RING,
          )}
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
        <Link
          to={`/clients/${client.id}`}
          aria-label={`View ${client.name}`}
          title="View client"
          className={cn(
            'grid size-8 place-items-center rounded-lg bg-gold text-on-gold transition-colors hover:bg-gold-hover',
            FOCUS_RING,
          )}
        >
          <Eye className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}

function CardSkeleton() {
  return (
    <li className={cn(CARD, 'flex min-h-20 animate-pulse items-center gap-3 p-3')} aria-hidden="true">
      <span className="size-11 shrink-0 rounded-full bg-slate-100" />
      <span className="flex flex-1 flex-col gap-2">
        <span className="h-3.5 w-2/3 rounded bg-slate-100" />
        <span className="h-3 w-4/5 rounded bg-slate-100" />
        <span className="h-3 w-1/2 rounded bg-slate-100" />
      </span>
      <span className="flex gap-1.5 self-end">
        <span className="size-8 rounded-lg bg-slate-100" />
        <span className="size-8 rounded-lg bg-slate-100" />
      </span>
    </li>
  );
}

export default function ClientsPage() {
  const { clients, clientsLoading, clientsError } = useAppData();
  const [query, setQuery] = useState('');

  const { filter: searchFilter } = useServerSearch('clients', query);

  const visibleClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return searchFilter(clients, (c) => searchText(c).includes(q));
  }, [clients, query, searchFilter]);

  const pagination = usePagination(visibleClients, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6 md:px-1">
      <PageHeader
        title="Clients"
        subtitle="Everyone you work for, with their locations and projects."
        actions={
          <>
            <Button to="/projects/new" icon={Briefcase}>
              Add project
            </Button>
            <Button to="/clients/new" variant="primary" icon={Plus}>
              Add client
            </Button>
          </>
        }
      />

      {clientsError && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          {clientsError}
        </p>
      )}

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search by name, phone, city, district or state"
        className="h-11! w-full max-w-[420px] border-panel-line bg-panel"
      />

      {clientsLoading ? (
        <ul className={GRID} aria-label="Loading clients">
          {Array.from({ length: 6 }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </ul>
      ) : visibleClients.length === 0 ? (
        clients.length ? (
          <EmptyState icon={SearchX} title="No match" description="Try a name, phone number, city, district or state." />
        ) : (
          <EmptyState icon={Users} title="No clients yet" action={<Button to="/clients/new" variant="primary">Add client</Button>} />
        )
      ) : (
        <>
          <ul className={GRID} aria-label="Clients">
            {pagination.pageItems.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </ul>
          {pagination.pageCount > 1 && (
            <Pagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              onPageChange={pagination.setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
