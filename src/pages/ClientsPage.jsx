import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Briefcase, Eye, Mail, MapPin, Phone, Plus, SearchX, Users } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import Badge from '../components/common/Badge.jsx';
import Avatar from '../components/common/Avatar.jsx';
import DataTable from '../components/common/DataTable.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';
import { STATUS_TONES } from '../data/constants.js';
import { useAppData } from '../context/AppDataContext.jsx';
import { formatDate } from '../utils/formatters.js';

const place = (loc) => [loc?.city, loc?.district, loc?.state].filter(Boolean).join(', ');

/** Everything searchable about a client: name, contact, phone and its location. */
function searchText(client) {
  const places = client.locations.map((l) => `${l.address} ${l.city} ${l.district} ${l.state} ${l.pin}`).join(' ');
  return `${client.name} ${client.contactName} ${client.phone} ${client.email} ${places}`.toLowerCase();
}

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{children || '—'}</dd>
    </div>
  );
}

export default function ClientsPage() {
  const { clientId } = useParams();
  const { clients, clientsLoading, clientsError, jobs } = useAppData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const visibleClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? clients.filter((c) => searchText(c).includes(q)) : clients;
  }, [clients, query]);

  const viewing = clientId ? clients.find((c) => c.id === clientId) : null;
  const viewingJobs = viewing ? jobs.filter((j) => j.clientId === viewing.id) : [];
  const location = viewing?.locations[0];
  const closeView = useCallback(() => navigate('/clients'), [navigate]);

  const columns = [
    {
      key: 'name',
      header: 'Client',
      sortable: true,
      sortValue: (c) => c.name,
      render: (c) => (
        <span className="flex items-center gap-3">
          <Avatar name={c.name} color="bg-teal-700" />
          <b>{c.name}</b>
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (c) => (
        <span className="block">
          {c.contactName}
          <span className="block text-[12.5px] text-muted">{c.phone}</span>
        </span>
      ),
    },
    { key: 'location', header: 'Location', render: (c) => place(c.locations[0]) || '—' },
    {
      key: 'view',
      header: '',
      className: 'text-right',
      render: (c) => (
        <Button to={`/clients/${c.id}`} size="sm" icon={Eye}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Clients"
        subtitle={clientsLoading ? 'Loading…' : `${clients.length} client${clients.length === 1 ? '' : 's'}`}
        actions={
          <>
            <Button to="/jobs/new" icon={Briefcase}>
              Add job
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

      <Card>
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name, phone, city, district or state" className="mb-4 max-w-md" />
        <DataTable
          columns={columns}
          rows={visibleClients}
          loading={clientsLoading}
          pageSize={8}
          minWidth={640}
          emptyState={
            clients.length ? (
              <EmptyState icon={SearchX} title="No match" description="Try a name, phone number, city, district or state." />
            ) : (
              <EmptyState icon={Users} title="No clients yet" action={<Button to="/clients/new" variant="primary">Add client</Button>} />
            )
          }
        />
      </Card>

      {viewing && (
        <Modal
          open
          size="lg"
          onClose={closeView}
          title={viewing.name}
          description={viewing.since ? `Client since ${formatDate(viewing.since)}` : undefined}
          footer={
            <>
              <Button onClick={closeView}>Close</Button>
              <Button to={`/jobs/new?client=${viewing.id}`} variant="primary" icon={Plus}>
                New job
              </Button>
            </>
          }
        >
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label="Contact person">
              {viewing.contactName}
              {viewing.designation && <span className="font-normal text-muted"> · {viewing.designation}</span>}
            </Detail>
            <Detail label="Phone">
              {viewing.phone && (
                <a href={`tel:${viewing.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-brand-ink">
                  <Phone className="size-3.5" aria-hidden="true" /> {viewing.phone}
                </a>
              )}
            </Detail>
            <Detail label="Email">
              {viewing.email && (
                <a href={`mailto:${viewing.email}`} className="inline-flex items-center gap-1.5 break-all hover:text-brand-ink">
                  <Mail className="size-3.5 shrink-0" aria-hidden="true" /> {viewing.email}
                </a>
              )}
            </Detail>
            <Detail label="GSTIN">{viewing.gstin}</Detail>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted">Location</dt>
              <dd className="mt-0.5 flex items-start gap-1.5 font-medium">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                {location ? (
                  <span>
                    {[location.address, location.city, location.district, location.state].filter(Boolean).join(', ')}
                    {location.pin && <span className="font-normal text-muted"> · {location.pin}</span>}
                  </span>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>

          <h3 className="mb-2 mt-6 text-sm font-semibold">Jobs ({viewingJobs.length})</h3>
          {viewingJobs.length === 0 ? (
            <p className="text-[13px] text-muted">No jobs for this client yet.</p>
          ) : (
            <ul className="flex flex-col">
              {viewingJobs.map((job) => (
                <li key={job.id} className="border-b border-line last:border-0">
                  <Link to={`/jobs/${job.id}`} className="-mx-2 flex flex-wrap items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50">
                    <span className="font-semibold text-brand-ink">{job.id}</span>
                    <span className="min-w-0 flex-1 truncate">{job.name}</span>
                    <Badge tone={STATUS_TONES[job.status] ?? 'slate'}>{job.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}
