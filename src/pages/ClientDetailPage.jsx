import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Briefcase, Mail, MapPin, Phone, Plus, SearchX, Users } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import DataTable from '../components/common/DataTable.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { buildJobColumns } from '../features/jobs/jobColumns.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import { formatDate } from '../utils/formatters.js';

function Detail({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{children || '—'}</dd>
    </div>
  );
}

export default function ClientDetailPage() {
  const { clientId } = useParams();
  const { clients, clientsLoading, jobs } = useAppData();
  const lookups = useLookups();
  const [query, setQuery] = useState('');

  const client = clients.find((c) => c.id === clientId);
  const location = client?.locations[0];

  const clientJobs = useMemo(() => jobs.filter((j) => j.clientId === clientId), [jobs, clientId]);
  const visibleJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? clientJobs.filter((j) => `${j.id} ${j.name} ${j.status}`.toLowerCase().includes(q)) : clientJobs;
  }, [clientJobs, query]);

  if (clientsLoading) return <p className="py-10 text-center text-[13px] text-muted">Loading client…</p>;

  if (!client) {
    return (
      <EmptyState
        icon={Users}
        title="Client not found"
        description="This client may have been removed."
        action={<Button to="/clients" variant="primary">Back to clients</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={client.name}
        subtitle={client.since ? `Client since ${formatDate(client.since)}` : undefined}
        breadcrumbs={[{ label: 'Clients', to: '/clients' }, { label: client.name }]}
        actions={
          <>
            <Button to="/clients">Back</Button>
            <Button to={`/jobs/new?client=${client.id}`} variant="primary" icon={Plus}>
              New job
            </Button>
          </>
        }
      />

      <Card>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Detail label="Contact person">
            {client.contactName}
            {client.designation && <span className="font-normal text-muted"> · {client.designation}</span>}
          </Detail>
          <Detail label="Phone">
            {client.phone && (
              <a href={`tel:${client.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-brand-ink">
                <Phone className="size-3.5" aria-hidden="true" /> {client.phone}
              </a>
            )}
          </Detail>
          <Detail label="Email">
            {client.email && (
              <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 break-all hover:text-brand-ink">
                <Mail className="size-3.5 shrink-0" aria-hidden="true" /> {client.email}
              </a>
            )}
          </Detail>
          <Detail label="GSTIN">{client.gstin}</Detail>
          <div className="min-w-0 sm:col-span-2 xl:col-span-4">
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
      </Card>

      <Card>
        <CardHeader title={`Jobs (${clientJobs.length})`} />
        <SearchInput value={query} onChange={setQuery} placeholder="Search by job ID, name or status" className="mb-4 max-w-md" />
        <DataTable
          key={`${client.id}-${query}`}
          columns={buildJobColumns(lookups, ['id', 'jobName', 'scope', 'progress', 'status', 'due'])}
          rows={visibleJobs}
          pageSize={8}
          minWidth={760}
          emptyState={
            clientJobs.length ? (
              <EmptyState icon={SearchX} title="No match" description="Try another job ID, name or status." />
            ) : (
              <EmptyState icon={Briefcase} title="No jobs yet" />
            )
          }
        />
      </Card>
    </div>
  );
}
