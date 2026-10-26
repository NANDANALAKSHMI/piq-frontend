import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Briefcase, Mail, MapPin, Phone, Plus, SearchX, Users } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import Tabs, { Chip } from '../components/common/Tabs.jsx';
import Badge from '../components/common/Badge.jsx';
import Avatar from '../components/common/Avatar.jsx';
import DataTable from '../components/common/DataTable.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useToast } from '../components/common/Toast.jsx';
import LocationModal from '../features/clients/LocationModal.jsx';
import { buildJobColumns } from '../features/jobs/jobColumns.jsx';
import { rankUnitsForCity } from '../features/jobs/jobFormHelpers.js';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import { isOverdue } from '../utils/jobs.js';
import { cn, formatDate } from '../utils/formatters.js';

const LIST_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active jobs' },
  { id: 'Bangalore', label: 'Bangalore' },
  { id: 'Chennai', label: 'Chennai' },
  { id: 'Kochi', label: 'Kochi' },
];

const JOB_TABS = [
  { id: 'In progress', label: 'Ongoing' },
  { id: 'Upcoming', label: 'Upcoming' },
  { id: 'Completed', label: 'Completed' },
  { id: 'On hold', label: 'On hold' },
];

function clientSummary(jobs) {
  const overdue = jobs.filter(isOverdue).length;
  const active = jobs.filter((j) => j.status === 'In progress').length;
  const upcoming = jobs.filter((j) => j.status === 'Upcoming').length;
  const onHold = jobs.filter((j) => j.status === 'On hold').length;
  if (overdue) return { tone: 'red', label: `${overdue} overdue` };
  if (active) return { tone: 'blue', label: `${active} active` };
  if (upcoming) return { tone: 'sky', label: `${upcoming} upcoming` };
  if (onHold) return { tone: 'amber', label: `${onHold} on hold` };
  return null;
}

export default function ClientsPage() {
  const { clientId } = useParams();
  const { clients, jobs, addLocation } = useAppData();
  const lookups = useLookups();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [jobTab, setJobTab] = useState('In progress');
  const [locationOpen, setLocationOpen] = useState(false);

  const jobsByClient = useMemo(() => {
    const map = new Map();
    jobs.forEach((job) => map.set(job.clientId, [...(map.get(job.clientId) ?? []), job]));
    return map;
  }, [jobs]);

  const visibleClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((client) => {
      if (q && !`${client.name} ${client.contactName} ${client.phone}`.toLowerCase().includes(q)) return false;
      if (filter === 'active') return (jobsByClient.get(client.id) ?? []).some((j) => ['In progress', 'Upcoming', 'On hold'].includes(j.status));
      if (filter !== 'all') return client.locations.some((l) => l.city === filter);
      return true;
    });
  }, [clients, query, filter, jobsByClient]);

  const selected = clients.find((c) => c.id === clientId) ?? clients[0];
  const clientJobs = jobsByClient.get(selected?.id) ?? [];
  const tabRows = clientJobs.filter((j) => j.status === jobTab);
  const history = clientJobs.filter((j) => j.status === 'Completed');

  const selectClient = (id) => {
    navigate(`/clients/${id}`);
    if (window.innerWidth < 1280) window.setTimeout(() => document.getElementById('client-profile')?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} clients · full project history for each one.`}
        actions={
          <>
            <Button to={selected ? `/jobs/new?client=${selected.id}` : '/jobs/new'} icon={Briefcase}>
              Add job
            </Button>
            <Button to="/clients/new" variant="primary" icon={Plus}>
              Add client
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(300px,1fr)_minmax(0,1.9fr)]">
        <Card className="self-start p-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Search clients" className="mb-3" />
          <div className="scrollbar-thin -mx-1 mb-2.5 flex gap-2 overflow-x-auto px-1 pb-1">
            {LIST_FILTERS.map((f) => (
              <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </Chip>
            ))}
          </div>
          {visibleClients.length === 0 ? (
            <EmptyState icon={SearchX} title="No clients found" description="Try another name or filter." />
          ) : (
            <ul className="flex max-h-[640px] flex-col overflow-y-auto">
              {visibleClients.map((client) => {
                const summary = clientSummary(jobsByClient.get(client.id) ?? []);
                const active = client.id === selected?.id;
                return (
                  <li key={client.id}>
                    <button
                      type="button"
                      onClick={() => selectClient(client.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-[10px] px-2.5 py-3 text-left transition-colors',
                        active ? 'bg-brand-soft' : 'hover:bg-slate-50',
                      )}
                    >
                      <Avatar name={client.name} color="bg-teal-700" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{client.name}</span>
                        <span className="block truncate text-[12.5px] text-muted">
                          {client.locations[0]?.city} · {client.contactName}
                        </span>
                      </span>
                      {summary ? (
                        <Badge tone={summary.tone} dot={false}>
                          {summary.label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted">No active jobs</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {selected ? (
          <div id="client-profile" className="flex min-w-0 scroll-mt-24 flex-col gap-5.5">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Avatar name={selected.name} color="bg-teal-700" size="lg" className="rounded-2xl" />
                  <div>
                    <h2 className="text-xl font-semibold">{selected.name}</h2>
                    <p className="text-[13px] text-muted">
                      Client since {formatDate(selected.since)} · {selected.industry}
                    </p>
                  </div>
                </div>
                <Button to={`/jobs/new?client=${selected.id}`} variant="primary" size="sm" icon={Plus}>
                  New job for client
                </Button>
              </div>
              <div className="my-4.5 h-px bg-line" />
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted">Contact person</dt>
                  <dd className="font-medium">{selected.contactName}{selected.designation && <span className="text-muted"> · {selected.designation}</span>}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Phone</dt>
                  <dd>
                    <a href={`tel:${selected.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 font-medium hover:text-brand-ink">
                      <Phone className="size-3.5" aria-hidden="true" /> {selected.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Email</dt>
                  <dd>
                    <a href={`mailto:${selected.email}`} className="inline-flex max-w-full items-center gap-1.5 truncate font-medium hover:text-brand-ink">
                      <Mail className="size-3.5 shrink-0" aria-hidden="true" /> {selected.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">GSTIN</dt>
                  <dd className="font-medium">{selected.gstin || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Client type</dt>
                  <dd className="font-medium">{selected.type}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Notes</dt>
                  <dd className="font-medium">{selected.notes || '—'}</dd>
                </div>
              </dl>
            </Card>

            <Card>
              <CardHeader
                title={`Locations · ${selected.locations.length}`}
                subtitle="Each job is tied to one of these sites."
                action={
                  <Button size="sm" icon={Plus} onClick={() => setLocationOpen(true)}>
                    Add location
                  </Button>
                }
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {selected.locations.map((loc) => {
                  const nearest = rankUnitsForCity(loc.city)[0];
                  const count = clientJobs.filter((j) => j.locationId === loc.id).length;
                  return (
                    <div key={loc.id} className={cn('flex flex-col gap-2 rounded-xl border p-3.5', loc.primary ? 'border-brand-line bg-[#fffbf6]' : 'border-line')}>
                      <div className="flex items-center justify-between">
                        <span className={cn('grid size-8.5 place-items-center rounded-lg', loc.primary ? 'bg-brand-soft text-brand-ink' : 'bg-slate-100 text-slate-600')}>
                          <MapPin className="size-4" aria-hidden="true" />
                        </span>
                        {loc.primary && <Badge tone="orange" dot={false}>Primary</Badge>}
                      </div>
                      <b>{loc.name}</b>
                      <span className="text-[12.5px] text-muted">
                        {[loc.address, loc.city, loc.pin].filter(Boolean).join(', ')}
                      </span>
                      <div className="mt-auto flex items-center justify-between text-[12.5px]">
                        <span>{nearest.name}{nearest.distance !== null && ` · ${nearest.distance} km`}</span>
                        <b>{count} job{count === 1 ? '' : 's'}</b>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                ['Total jobs', clientJobs.length, ''],
                ['Ongoing', clientJobs.filter((j) => j.status === 'In progress').length, 'text-blue-700'],
                ['Upcoming', clientJobs.filter((j) => j.status === 'Upcoming').length, 'text-sky-700'],
                ['Completed', history.length, 'text-green-700'],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-2xl border border-line bg-white p-4">
                  <p className="text-[13px] text-muted">{label}</p>
                  <p className={cn('text-[26px] font-bold', color)}>{value}</p>
                </div>
              ))}
            </div>

            <Card padded={false}>
              <Tabs
                tabs={JOB_TABS.map((t) => ({ ...t, count: clientJobs.filter((j) => j.status === t.id).length }))}
                active={jobTab}
                onChange={setJobTab}
                label="Client jobs"
                className="px-4"
              />
              <div className="p-4">
                <DataTable
                  key={`${selected.id}-${jobTab}`}
                  columns={buildJobColumns(lookups, ['id', 'jobName', 'scope', 'stage', 'status', 'due'])}
                  rows={tabRows}
                  minWidth={700}
                  pageSize={5}
                  emptyState={
                    <EmptyState
                      icon={Briefcase}
                      title={`No ${JOB_TABS.find((t) => t.id === jobTab).label.toLowerCase()} jobs`}
                      action={<Button to={`/jobs/new?client=${selected.id}`} size="sm" icon={Plus}>New job for {selected.name}</Button>}
                    />
                  }
                />
              </div>
            </Card>

            <Card>
              <CardHeader title="Project history" subtitle="Completed jobs, with media and comments" />
              {history.length === 0 ? (
                <p className="text-[13px] text-muted">No completed jobs yet.</p>
              ) : (
                <ul className="flex flex-col">
                  {history.map((job) => (
                    <li key={job.id} className="border-b border-line last:border-0">
                      <Link to={`/jobs/${job.id}`} className="-mx-2 flex flex-wrap items-center gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
                        <span className="font-semibold text-brand-ink">{job.id}</span>
                        <span className="flex-1">{job.name}</span>
                        <span className="text-[12.5px] text-muted">
                          {formatDate(job.dueDate)} · {job.media.length} files · {job.comments.length} comments
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        ) : (
          <EmptyState icon={Users} title="No clients yet" action={<Button to="/clients/new" variant="primary">Add client</Button>} />
        )}
      </div>

      {selected && (
        <LocationModal
          open={locationOpen}
          clientName={selected.name}
          onClose={() => setLocationOpen(false)}
          onSave={(location) => {
            addLocation(selected.id, location);
            setLocationOpen(false);
            showToast(`${location.name} added to ${selected.name}.`);
          }}
        />
      )}
    </div>
  );
}
