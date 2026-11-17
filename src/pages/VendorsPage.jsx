import { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, SearchX, Truck, TriangleAlert, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { StatusBadge, Tag } from '../components/common/Badge.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import DataTable from '../components/common/DataTable.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { SelectControl } from '../components/common/FormFields.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useServices from '../hooks/useServices.js';
import { buildVendorLookups } from '../features/vendors/vendorLookups.js';
import { VENDOR_STATUSES } from '../features/vendors/vendorStatus.js';

const NO_FILTERS = { state: '', district: '', city: '', categoryId: '', status: '' };

const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));

/** First two names as tags, then "+N". */
function TagList({ names }) {
  if (!names.length) return <span className="text-muted">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5" title={names.join(', ')}>
      {names.slice(0, 2).map((name) => (
        <Tag key={name}>{name}</Tag>
      ))}
      {names.length > 2 && <Tag className="bg-brand-soft text-brand-ink">+{names.length - 2}</Tag>}
    </div>
  );
}

export default function VendorsPage() {
  const { vendors, vendorsLoading, vendorsError } = useAppData();
  const { services } = useServices();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(NO_FILTERS);

  const lookups = useMemo(() => buildVendorLookups(services), [services]);

  // Location filters only offer places that vendors are actually in, each narrowed by the one before.
  const stateOptions = useMemo(() => uniqueSorted(vendors.map((v) => v.state)), [vendors]);
  const districtOptions = useMemo(
    () => uniqueSorted(vendors.filter((v) => !filters.state || v.state === filters.state).map((v) => v.district)),
    [vendors, filters.state],
  );
  const cityOptions = useMemo(
    () =>
      uniqueSorted(
        vendors.filter((v) => (!filters.state || v.state === filters.state) && (!filters.district || v.district === filters.district)).map((v) => v.city),
      ),
    [vendors, filters.state, filters.district],
  );

  const setFilter = (key) => (e) =>
    setFilters((current) => {
      const next = { ...current, [key]: e.target.value };
      if (key === 'state') Object.assign(next, { district: '', city: '' });
      if (key === 'district') next.city = '';
      return next;
    });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vendors.filter((v) => {
      if (filters.state && v.state !== filters.state) return false;
      if (filters.district && v.district !== filters.district) return false;
      if (filters.city && v.city !== filters.city) return false;
      if (filters.categoryId && !v.serviceIds.includes(filters.categoryId)) return false;
      if (filters.status && v.status !== filters.status) return false;
      if (q && !`${v.name} ${v.contactPerson} ${v.phone} ${v.email} ${v.city}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [vendors, filters, query]);

  const filtered = query.trim() || Object.values(filters).some(Boolean);
  const counts = Object.fromEntries(VENDOR_STATUSES.map(({ value }) => [value, vendors.filter((v) => v.status === value).length]));

  const columns = [
    {
      key: 'name',
      header: 'Vendor name',
      sortable: true,
      render: (v) => (
        <Button to={`/vendors/${v.id}`} variant="ghost" className="-mx-2 h-auto justify-start px-2 py-1 text-left font-semibold">
          {v.name}
        </Button>
      ),
    },
    { key: 'contactPerson', header: 'Contact person', sortable: true, render: (v) => v.contactPerson || <span className="text-muted">—</span> },
    {
      key: 'phone',
      header: 'Phone',
      render: (v) => (
        <a href={`tel:${v.phone.replace(/\s/g, '')}`} className="hover:text-brand-ink">
          {v.phone}
        </a>
      ),
    },
    { key: 'state', header: 'State', sortable: true, render: (v) => v.state || <span className="text-muted">—</span> },
    { key: 'district', header: 'District', sortable: true, render: (v) => v.district || <span className="text-muted">—</span> },
    { key: 'city', header: 'City', sortable: true, render: (v) => v.city || <span className="text-muted">—</span> },
    { key: 'categories', header: 'Categories', render: (v) => <TagList names={lookups.categoryNames(v)} /> },
    { key: 'services', header: 'Services', render: (v) => <TagList names={lookups.serviceNames(v)} /> },
    { key: 'status', header: 'Status', sortable: true, render: (v) => <StatusBadge value={v.status} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      render: (v) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" icon={Eye} to={`/vendors/${v.id}`} aria-label={`View ${v.name}`}>
            View
          </Button>
          <Button size="sm" variant="ghost" icon={Pencil} to={`/vendors/${v.id}/edit`} aria-label={`Edit ${v.name}`}>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Vendors"
        subtitle={
          vendors.length
            ? `${vendors.length} vendor${vendors.length === 1 ? '' : 's'} · ${counts.Preferred} preferred · ${counts.Approved} approved · ${counts['On hold']} on hold`
            : 'Your suppliers: what they provide and where they are.'
        }
        actions={
          <Button to="/vendors/new" variant="primary" icon={Plus}>
            Add vendor
          </Button>
        }
      />

      {vendorsError && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div className="text-[13px]">
            <p className="font-semibold text-amber-900">Vendors aren’t connected yet</p>
            <p className="mt-0.5 text-amber-800">{vendorsError}</p>
          </div>
        </div>
      )}

      <Card padded={false}>
        <div className="flex flex-col gap-2.5 p-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, contact, phone or email" className="w-full" />
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
            <SelectControl aria-label="State" value={filters.state} onChange={setFilter('state')} placeholder="State: All" options={stateOptions} />
            <SelectControl aria-label="District" value={filters.district} onChange={setFilter('district')} placeholder="District: All" options={districtOptions} />
            <SelectControl aria-label="City" value={filters.city} onChange={setFilter('city')} placeholder="City: All" options={cityOptions} />
            <SelectControl
              aria-label="Category"
              value={filters.categoryId}
              onChange={setFilter('categoryId')}
              placeholder="Category: All"
              options={services.map((c) => ({ value: c.id, label: c.name }))}
            />
            <SelectControl aria-label="Status" value={filters.status} onChange={setFilter('status')} placeholder="Status: All" options={VENDOR_STATUSES.map((s) => s.value)} />
            {filtered && (
              <Button
                icon={X}
                variant="ghost"
                onClick={() => {
                  setFilters(NO_FILTERS);
                  setQuery('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
          {filtered && !vendorsLoading && (
            <p className="text-[13px] text-muted">
              Showing <b className="text-ink">{rows.length}</b> of {vendors.length} vendors
            </p>
          )}
        </div>
        <div className="px-2 pb-4 sm:px-4">
          <DataTable
            columns={columns}
            rows={rows}
            loading={vendorsLoading}
            pageSize={10}
            minWidth={1180}
            emptyState={
              vendors.length === 0 ? (
                <EmptyState
                  icon={Truck}
                  title="No vendors yet"
                  description="Click “Add vendor” to add your first supplier."
                />
              ) : (
                <EmptyState icon={SearchX} title="No vendors match" description="Try another search or clear the filters." />
              )
            }
          />
        </div>
      </Card>
    </div>
  );
}
