import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, FileText, Hammer, Layers, Phone, Plus, Printer, SearchX, Shield, Star, Trees, Truck } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { StatusBadge, Tag } from '../components/common/Badge.jsx';
import { Chip } from '../components/common/Tabs.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import DataTable, { CellStack } from '../components/common/DataTable.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { SelectControl } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { AddVendorModal, PurchaseOrderModal } from '../features/vendors/VendorModals.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import { vendorCategories, getVendorCategory } from '../data/vendorsData.js';
import { CITIES } from '../data/constants.js';
import { cn } from '../utils/formatters.js';

const CATEGORY_ICONS = {
  'vc-wood': Trees,
  'vc-corrugated': Boxes,
  'vc-protective': Shield,
  'vc-printing': Printer,
  'vc-transport': Truck,
  'vc-hardware': Hammer,
};

const TONE_CLASSES = {
  orange: 'bg-brand-soft text-brand-ink',
  blue: 'bg-blue-50 text-blue-700',
  violet: 'bg-violet-50 text-violet-700',
  sky: 'bg-sky-50 text-sky-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
};

export default function VendorsPage() {
  const { vendors, jobs, addVendor, updateVendor } = useAppData();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [categoryId, setCategoryId] = useState(vendorCategories[0].id);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);

  const category = getVendorCategory(categoryId);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vendors.filter(
      (v) =>
        v.categoryIds.includes(categoryId) &&
        (!city || v.city === city) &&
        (!q || `${v.name} ${v.contact} ${v.supplies.join(' ')}`.toLowerCase().includes(q)),
    );
  }, [vendors, categoryId, city, query]);

  const selected = vendors.find((v) => v.id === selectedId && v.categoryIds.includes(categoryId)) ?? rows[0];
  const vendorJobs = selected ? jobs.filter((j) => j.vendorIds.includes(selected.id)) : [];
  const activeJobs = jobs.filter((j) => ['In progress', 'Upcoming'].includes(j.status));

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Vendors"
        subtitle={`${vendors.length} suppliers across ${vendorCategories.length} categories. Pick them per job, and see who’s preferred in each city.`}
        actions={
          <>
            <Button to="/categories" icon={Layers}>
              Job categories
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setModal('add')}>
              Add vendor
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6" aria-label="Vendor categories">
        {vendorCategories.map((vc) => {
          const Icon = CATEGORY_ICONS[vc.id];
          const count = vendors.filter((v) => v.categoryIds.includes(vc.id)).length;
          const active = vc.id === categoryId;
          return (
            <button
              key={vc.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCategoryId(vc.id);
                setSelectedId(null);
              }}
              className={cn(
                'flex flex-col gap-2 rounded-2xl border bg-white p-4 text-left transition-colors hover:border-slate-300',
                active ? 'border-2 border-brand bg-[#fffbf6]' : 'border-line',
              )}
            >
              <span className="flex items-center justify-between">
                <span className={cn('grid size-9.5 place-items-center rounded-[10px]', TONE_CLASSES[vc.tone])}>
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <span className="text-[13px] font-semibold">{count}</span>
              </span>
              <b className="leading-snug">{vc.name}</b>
              <span className="text-[12.5px] text-muted">{vc.description}</span>
            </button>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card padded={false}>
          <div className="flex flex-wrap items-center gap-2.5 p-4">
            <h2 className="mr-auto text-base font-semibold">
              {category.name} · {rows.length} vendor{rows.length === 1 ? '' : 's'}
            </h2>
            <SearchInput value={query} onChange={setQuery} placeholder="Search vendors" className="w-full sm:w-56" />
            <SelectControl aria-label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City: All" options={CITIES} className="w-auto" />
          </div>
          <div className="px-2 pb-4 sm:px-4">
            <DataTable
              key={categoryId}
              rows={rows}
              minWidth={820}
              pageSize={6}
              rowClassName={(v) => v.id === selected?.id && 'bg-brand-soft/60 hover:bg-brand-soft/60'}
              emptyState={<EmptyState icon={SearchX} title="No vendors here yet" action={<Button size="sm" icon={Plus} onClick={() => setModal('add')}>Add vendor</Button>} />}
              columns={[
                {
                  key: 'name',
                  header: 'Vendor',
                  sortable: true,
                  render: (v) => (
                    <button type="button" onClick={() => setSelectedId(v.id)} className="text-left hover:text-brand-ink">
                      <CellStack primary={v.name} secondary={`${v.contact} · ${v.phone}`} />
                    </button>
                  ),
                },
                { key: 'city', header: 'City', sortable: true },
                { key: 'supplies', header: 'Supplies', render: (v) => <div className="flex gap-1.5">{v.supplies.slice(0, 2).map((s) => <Tag key={s}>{s}</Tag>)}</div> },
                { key: 'leadDays', header: 'Lead time', sortable: true, render: (v) => `${v.leadDays} day${v.leadDays === 1 ? '' : 's'}` },
                { key: 'rating', header: 'Rating', sortable: true, render: (v) => (v.rating ? <span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />{v.rating.toFixed(1)}</span> : <span className="text-muted">New</span>) },
                { key: 'status', header: 'Status', sortable: true, render: (v) => <StatusBadge value={v.status} /> },
              ]}
            />
          </div>
        </Card>

        {selected ? (
          <Card className="self-start">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] text-muted">
                  {category.name} · {selected.city}
                </p>
                <h2 className="mt-0.5 text-[19px] font-semibold">{selected.name}</h2>
              </div>
              <StatusBadge value={selected.status} />
            </div>
            <div className="my-4 h-px bg-line" />
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-muted">Contact</dt>
                <dd className="font-medium">{selected.contact || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Phone</dt>
                <dd>
                  <a href={`tel:${selected.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 font-medium hover:text-brand-ink">
                    <Phone className="size-3.5" aria-hidden="true" />
                    {selected.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Address</dt>
                <dd className="font-medium">{selected.address || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Payment terms</dt>
                <dd className="font-medium">{selected.payment}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Serves units</dt>
                <dd className="font-medium">{selected.unitIds.map((id) => lookups.getUnit(id)?.city).join(' · ') || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Lead time</dt>
                <dd className="font-medium">{selected.leadDays} days</dd>
              </div>
            </dl>

            <p className="mb-2 mt-4 text-xs text-muted">Listed under</p>
            <div className="flex flex-wrap gap-2">
              {selected.categoryIds.map((id) => (
                <Chip key={id} active={id === categoryId} onClick={() => setCategoryId(id)}>
                  {getVendorCategory(id)?.name}
                </Chip>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="vendor-status" className="text-xs font-semibold text-muted">
                Vendor status
              </label>
              <SelectControl
                id="vendor-status"
                value={selected.status}
                onChange={(e) => {
                  updateVendor(selected.id, { status: e.target.value });
                  showToast(`${selected.name} marked ${e.target.value}.`);
                }}
                options={['Preferred', 'Approved', 'On hold']}
              />
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
              <div className="flex items-center justify-between">
                <b>Used in jobs</b>
                <span className="text-[13px] text-muted">{selected.jobsUsed} total</span>
              </div>
              {vendorJobs.length === 0 ? (
                <p className="mt-2 text-[13px] text-muted">Not linked to any current job.</p>
              ) : (
                <ul className="mt-1.5 flex flex-col">
                  {vendorJobs.slice(0, 4).map((job) => (
                    <li key={job.id} className="flex items-center gap-3 border-b border-line py-2 text-[13px] last:border-0">
                      <Link to={`/jobs/${job.id}`} className="font-semibold text-brand-ink hover:underline">
                        {job.id}
                      </Link>
                      <span className="min-w-0 flex-1 truncate text-muted">{job.name}</span>
                      <StatusBadge value={job.status === 'Completed' ? 'Done' : job.status} dot={false} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button variant="primary" fullWidth icon={FileText} className="mt-4" onClick={() => setModal('po')} disabled={selected.status === 'On hold'}>
              {selected.status === 'On hold' ? 'Vendor on hold' : 'Raise purchase order'}
            </Button>
          </Card>
        ) : (
          <EmptyState title="Select a vendor" description="Pick a vendor from the list to see their details." />
        )}
      </div>

      {modal === 'add' && (
        <AddVendorModal
          open
          defaultCategoryId={categoryId}
          onClose={() => setModal(null)}
          onSave={(vendor) => {
            addVendor(vendor);
            setModal(null);
            setCategoryId(vendor.categoryIds[0]);
            showToast(`${vendor.name} added to vendors.`);
          }}
        />
      )}
      {modal === 'po' && selected && (
        <PurchaseOrderModal
          open
          vendor={selected}
          jobs={activeJobs}
          onClose={() => setModal(null)}
          onSend={(po) => {
            setModal(null);
            showToast(`PO for ${po.quantity} ${po.item} sent to ${selected.name}.`);
          }}
        />
      )}
    </div>
  );
}
