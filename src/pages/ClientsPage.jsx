import { useMemo, useState } from 'react';
import { Briefcase, Eye, Plus, SearchX, Users } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import Avatar from '../components/common/Avatar.jsx';
import DataTable from '../components/common/DataTable.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useAppData } from '../context/AppDataContext.jsx';

const place = (loc) => [loc?.city, loc?.district, loc?.state].filter(Boolean).join(', ');

/** Everything searchable about a client: name, contact, phone and its location. */
function searchText(client) {
  const places = client.locations.map((l) => `${l.address} ${l.city} ${l.district} ${l.state} ${l.pin}`).join(' ');
  return `${client.name} ${client.contactName} ${client.phone} ${client.email} ${places}`.toLowerCase();
}

export default function ClientsPage() {
  const { clients, clientsLoading, clientsError } = useAppData();
  const [query, setQuery] = useState('');

  const visibleClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? clients.filter((c) => searchText(c).includes(q)) : clients;
  }, [clients, query]);


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
    </div>
  );
}
