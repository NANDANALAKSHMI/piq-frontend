import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Tag as TagIcon } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Tabs, { Chip } from '../components/common/Tabs.jsx';
import Toggle from '../components/common/Toggle.jsx';
import Modal from '../components/common/Modal.jsx';
import DataTable from '../components/common/DataTable.jsx';
import { Tag } from '../components/common/Badge.jsx';
import { SelectField, TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import { jobCategories, serviceCatalog } from '../data/categoriesData.js';
import { workflowTemplates } from '../data/workflowsData.js';
import { vendorCategories } from '../data/vendorsData.js';
import { SCOPE_SERVICES, SERVICES, SERVICE_SCOPES } from '../data/constants.js';
import { cn } from '../utils/formatters.js';

function AddCategoryModal({ open, onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add category"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), description })}>
            Add category
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <TextField label="Category name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Art & Museum Packing" />
        <TextField label="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
    </Modal>
  );
}

export default function CategoriesPage() {
  const { jobs } = useAppData();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [categories, setCategories] = useState(jobCategories);
  const [selectedId, setSelectedId] = useState('cat-crating');
  const [tab, setTab] = useState('categories');
  const [newSub, setNewSub] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const selected = categories.find((c) => c.id === selectedId) ?? categories[0];
  const jobCount = (id) => jobs.filter((j) => j.categoryId === id).length;

  const patch = (changes) => setCategories((list) => list.map((c) => (c.id === selected.id ? { ...c, ...changes } : c)));

  const addSubcategory = (event) => {
    event.preventDefault();
    if (!newSub.trim()) return;
    patch({ subcategories: [...selected.subcategories, { id: `sc-${Date.now()}`, name: newSub.trim(), note: '', leadTime: '—', active: true }] });
    setNewSub('');
  };

  const toggleVendorCategory = (id) =>
    patch({
      vendorCategoryIds: selected.vendorCategoryIds.includes(id)
        ? selected.vendorCategoryIds.filter((v) => v !== id)
        : [...selected.vendorCategoryIds, id],
    });

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Categories & Services"
        subtitle="Job categories, their subcategories, the services you offer and scope presets used when creating jobs."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
            Add category
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: 'categories', label: 'Job categories', count: categories.length },
          { id: 'services', label: 'Services', count: serviceCatalog.length },
          { id: 'presets', label: 'Scope presets', count: SERVICE_SCOPES.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'categories' && (
        <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(280px,1fr)_minmax(0,1.9fr)]">
          <Card className="self-start p-3">
            <ul className="flex flex-col gap-0.5">
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    aria-current={c.id === selected.id ? 'true' : undefined}
                    className={cn('flex w-full items-center gap-3 rounded-[10px] p-3 text-left', c.id === selected.id ? 'bg-brand-soft' : 'hover:bg-slate-50')}
                  >
                    <span className="grid size-9.5 place-items-center rounded-[10px] bg-white text-brand-ink ring-1 ring-line">
                      <TagIcon className="size-4" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-semibold">{c.name}</span>
                      <span className="block text-[12.5px] text-muted">
                        {c.subcategories.length} subcategories · {jobCount(c.id)} jobs
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex min-w-0 flex-col gap-5.5">
            <Card>
              <CardHeader
                title={selected.name}
                subtitle={selected.description}
                action={
                  <Button variant="primary" size="sm" onClick={() => showToast(`${selected.name} saved.`)}>
                    Save
                  </Button>
                }
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <TextField label="Category name" value={selected.name} onChange={(e) => patch({ name: e.target.value })} />
                <SelectField
                  label="Default workflow"
                  value={selected.defaultTemplateId}
                  onChange={(e) => patch({ defaultTemplateId: e.target.value })}
                  options={workflowTemplates.map((t) => ({ value: t.id, label: `${t.name} · ${t.stages.length} stages` }))}
                />
                <SelectField label="Default scope" value={selected.defaultScope} onChange={(e) => patch({ defaultScope: e.target.value })} options={SERVICE_SCOPES} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Subcategories" />
              <DataTable
                rows={selected.subcategories}
                minWidth={520}
                columns={[
                  { key: 'name', header: 'Subcategory', render: (s) => <div><b>{s.name}</b>{s.note && <p className="text-[12.5px] text-muted">{s.note}</p>}</div> },
                  { key: 'jobs', header: 'Jobs', render: (s) => jobs.filter((j) => j.categoryId === selected.id && j.subcategory === s.name).length },
                  { key: 'leadTime', header: 'Typical lead time' },
                  {
                    key: 'active',
                    header: 'Active',
                    render: (s) => (
                      <Toggle
                        checked={s.active}
                        label={`${s.name} active`}
                        onChange={(value) => patch({ subcategories: selected.subcategories.map((x) => (x.id === s.id ? { ...x, active: value } : x)) })}
                      />
                    ),
                  },
                ]}
              />
              <form onSubmit={addSubcategory} className="mt-3.5 flex gap-2.5">
                <TextField aria-label="New subcategory" value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="New subcategory name" className="flex-1" />
                <Button type="submit" icon={Plus} disabled={!newSub.trim()}>
                  Add
                </Button>
              </form>
            </Card>

            <Card>
              <CardHeader title="Services offered in this category" subtitle="Shown as options in the job’s service scope." />
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {SERVICES.map((service) => (
                  <li key={service} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3">
                    <span>
                      <b>{service}</b>
                      <span className="block text-[12.5px] text-muted">
                        {serviceCatalog.find((s) => s.name === service)?.unitIds.map((id) => lookups.getUnit(id)?.city).join(', ')}
                      </span>
                    </span>
                    <Toggle
                      checked={selected.services[service]}
                      label={`${service} included`}
                      onChange={(value) => patch({ services: { ...selected.services, [service]: value } })}
                    />
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader
                title="Vendor categories needed"
                subtitle="PIQ suggests vendors from these categories when a job is created."
                action={<Link to="/vendors" className="text-[13px] font-semibold text-brand-ink hover:underline">Open vendors</Link>}
              />
              <div className="flex flex-wrap gap-2">
                {vendorCategories.map((vc) => (
                  <Chip key={vc.id} active={selected.vendorCategoryIds.includes(vc.id)} onClick={() => toggleVendorCategory(vc.id)}>
                    {vc.name}
                  </Chip>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'services' && (
        <Card>
          <CardHeader title="Service catalog" subtitle="Every service PIQ can be responsible for on a job." />
          <DataTable
            rows={serviceCatalog}
            rowKey={(s) => s.name}
            minWidth={560}
            columns={[
              { key: 'name', header: 'Service', sortable: true, render: (s) => <b>{s.name}</b> },
              { key: 'ownerRole', header: 'Default owner', sortable: true },
              { key: 'units', header: 'Units that offer it', render: (s) => <div className="flex gap-1.5">{s.unitIds.map((id) => <Tag key={id}>{lookups.getUnit(id)?.city}</Tag>)}</div> },
              { key: 'categories', header: 'Used by categories', render: (s) => categories.filter((c) => c.services[s.name]).length },
            ]}
          />
        </Card>
      )}

      {tab === 'presets' && (
        <Card>
          <CardHeader title="Scope presets" subtitle="Quick choices when defining what PIQ is responsible for on a job." />
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {SERVICE_SCOPES.map((scope) => (
              <li key={scope} className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between">
                  <b>{scope}</b>
                  <span className="text-[13px] text-muted">{jobs.filter((j) => j.scope === scope).length} jobs</span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {scope === 'Custom' ? <span className="text-[13px] text-muted">Pick any combination of services per job</span> : SCOPE_SERVICES[scope].map((s) => <Tag key={s}>{s}</Tag>)}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {addOpen && (
        <AddCategoryModal
          open
          onClose={() => setAddOpen(false)}
          onSave={({ name, description }) => {
            const id = `cat-${Date.now()}`;
            setCategories((list) => [
              ...list,
              {
                id,
                name,
                description,
                defaultTemplateId: workflowTemplates[0].id,
                defaultScope: 'Custom',
                vendorCategoryIds: [],
                services: Object.fromEntries(SERVICES.map((s) => [s, false])),
                subcategories: [],
              },
            ]);
            setSelectedId(id);
            setTab('categories');
            setAddOpen(false);
            showToast(`${name} added.`);
          }}
        />
      )}
    </div>
  );
}
