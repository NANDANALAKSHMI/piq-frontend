import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, MapPin, Plus } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Badge, { StatusBadge, Tag } from '../components/common/Badge.jsx';
import { Checkbox, SelectControl, SelectField, TextArea, TextField } from '../components/common/FormFields.jsx';
import { Chip } from '../components/common/Tabs.jsx';
import { AvatarStack } from '../components/common/Avatar.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import { jobCategories } from '../data/categoriesData.js';
import { workflowTemplates, getTemplate } from '../data/workflowsData.js';
import { vendorCategories } from '../data/vendorsData.js';
import { PRIORITIES, SCOPE_SERVICES, SERVICES, SERVICE_SCOPES } from '../data/constants.js';
import { rankUnitsForCity, suggestVendors } from '../features/jobs/jobFormHelpers.js';
import { cn, daysFromToday } from '../utils/formatters.js';

const DEFAULT_OWNER_TITLE = {
  'Site survey': 'Packing supervisor',
  Design: 'Packaging designer',
  Production: 'Unit manager',
  Packing: 'Packing supervisor',
  Delivery: 'Logistics coordinator',
  Installation: 'Unit manager',
};

function SectionTitle({ number, title, subtitle, action }) {
  return (
    <CardHeader
      title={
        <span className="flex items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-navy text-xs font-bold text-white">{number}</span>
          {title}
        </span>
      }
      subtitle={subtitle}
      action={action}
    />
  );
}

export default function AddJobPage() {
  const { clients, members, vendors, addJob } = useAppData();
  const lookups = useLookups();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialClient = clients.find((c) => c.id === searchParams.get('client')) ?? clients[0];
  const initialCategory = jobCategories.find((c) => c.id === 'cat-crating');

  const [form, setForm] = useState({
    clientId: initialClient.id,
    locationId: initialClient.locations.find((l) => l.primary)?.id ?? initialClient.locations[0]?.id,
    name: '',
    categoryId: initialCategory.id,
    subcategory: initialCategory.subcategories[0].name,
    priority: 'Medium',
    startDate: daysFromToday(2),
    dueDate: daysFromToday(16),
    quantity: '',
    description: '',
    scope: initialCategory.defaultScope,
    services: SCOPE_SERVICES[initialCategory.defaultScope],
    owners: {},
    templateId: initialCategory.defaultTemplateId,
    unitId: '',
    vendorChoices: {},
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const client = clients.find((c) => c.id === form.clientId);
  const location = client?.locations.find((l) => l.id === form.locationId);
  const category = jobCategories.find((c) => c.id === form.categoryId);
  const template = getTemplate(form.templateId);
  const rankedUnits = rankUnitsForCity(location?.city);
  const unitId = form.unitId || rankedUnits[0].id;
  const unit = lookups.getUnit(unitId);

  const ownerFor = (service) => {
    if (form.owners[service]) return form.owners[service];
    const title = DEFAULT_OWNER_TITLE[service];
    return (members.find((m) => m.unitId === unitId && m.title === title) ?? members.find((m) => m.title === title) ?? members[0]).id;
  };

  const vendorRows = (category?.vendorCategoryIds ?? []).map((vcId) => {
    const options = suggestVendors(vendors, vcId, unitId);
    return { category: vendorCategories.find((vc) => vc.id === vcId), options, chosen: form.vendorChoices[vcId] ?? options[0]?.id ?? '' };
  });

  const teamIds = [...new Set(form.services.map(ownerFor))];

  const changeClient = (clientId) => {
    const next = clients.find((c) => c.id === clientId);
    set({ clientId, locationId: next.locations.find((l) => l.primary)?.id ?? next.locations[0]?.id, unitId: '' });
  };

  const changeCategory = (categoryId) => {
    const next = jobCategories.find((c) => c.id === categoryId);
    set({
      categoryId,
      subcategory: next.subcategories[0]?.name ?? '',
      templateId: next.defaultTemplateId,
      scope: next.defaultScope,
      services: SCOPE_SERVICES[next.defaultScope].length ? SCOPE_SERVICES[next.defaultScope] : form.services,
      vendorChoices: {},
    });
  };

  const changeScope = (scope) => set({ scope, services: scope === 'Custom' ? form.services : SCOPE_SERVICES[scope] });

  const toggleService = (service) => {
    const services = form.services.includes(service) ? form.services.filter((s) => s !== service) : [...form.services, service];
    set({ services: SERVICES.filter((s) => services.includes(s)), scope: 'Custom' });
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Give the job a name.';
    if (!form.locationId) next.location = 'Choose where the job happens.';
    if (form.dueDate < form.startDate) next.dueDate = 'Due date must be after the start date.';
    if (!form.services.length) next.services = 'Pick at least one service.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const checklist = [
    { label: 'Client & location', done: Boolean(form.clientId && form.locationId) },
    { label: 'Job details', done: Boolean(form.name.trim()) },
    { label: 'Service scope', done: form.services.length > 0 },
    { label: 'Vendors', done: vendorRows.every((r) => r.chosen || !r.options.length) },
    { label: 'Workflow & unit', done: Boolean(form.templateId && unitId) },
  ];

  const handleCreate = () => {
    if (!validate()) {
      showToast('Please fix the highlighted fields.', { tone: 'info' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const id = addJob({
      name: form.name.trim(),
      clientId: form.clientId,
      locationId: form.locationId,
      categoryId: form.categoryId,
      subcategory: form.subcategory,
      unitId,
      scope: form.scope,
      templateId: form.templateId,
      status: 'Upcoming',
      priority: form.priority,
      startDate: form.startDate,
      dueDate: form.dueDate,
      teamIds,
      description: [form.description, form.quantity && `Quantity: ${form.quantity}`, form.notes && `Internal notes: ${form.notes}`].filter(Boolean).join('\n\n'),
      vendorIds: vendorRows.map((r) => r.chosen).filter(Boolean),
      services: form.services.map((name) => ({ name, ownerId: ownerFor(name), progress: 0 })),
    });
    showToast(`${id} created.`);
    navigate(`/jobs/${id}`);
  };

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="New job"
        breadcrumbs={[{ label: 'Jobs', to: '/jobs' }, { label: 'New job' }]}
        subtitle="A job ID is assigned automatically when you create it."
        actions={
          <>
            <Button to="/jobs">Cancel</Button>
            <Button variant="primary" icon={Check} onClick={handleCreate}>
              Create job
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5.5">
          <Card>
            <SectionTitle number={1} title="Client & location" action={<Link to="/clients/new" className="text-[13px] font-semibold text-brand-ink hover:underline">+ New client</Link>} />
            <SelectField
              label="Client"
              required
              value={form.clientId}
              onChange={(e) => changeClient(e.target.value)}
              options={clients.map((c) => ({ value: c.id, label: c.name }))}
              className="mb-4 sm:max-w-sm"
            />
            <p className="mb-2 text-xs font-semibold text-muted">
              Job location <span className="text-red-600">*</span>
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Job location">
              {client.locations.map((loc) => {
                const nearest = rankUnitsForCity(loc.city)[0];
                const selected = loc.id === form.locationId;
                return (
                  <label
                    key={loc.id}
                    className={cn(
                      'flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5 transition-colors',
                      selected ? 'border-2 border-brand bg-[#fffbf6]' : 'border-line hover:border-slate-300',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <b>{loc.name}</b>
                      <input type="radio" name="location" checked={selected} onChange={() => set({ locationId: loc.id, unitId: '' })} className="size-4.5 accent-navy" />
                    </span>
                    <span className="text-[12.5px] text-muted">{loc.address}, {loc.city}</span>
                    <Badge tone={nearest.distance !== null && nearest.distance < 60 ? 'green' : 'slate'} dot={false} className="self-start">
                      {nearest.name}{nearest.distance !== null && ` · ${nearest.distance} km`}
                    </Badge>
                  </label>
                );
              })}
              <Link
                to="/clients/new"
                className="flex min-h-24 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-slate-300 text-[13px] font-semibold text-muted hover:border-brand hover:text-brand-ink"
              >
                <Plus className="size-4" aria-hidden="true" /> Add new location
              </Link>
            </div>
            {errors.location && <p className="mt-2 text-xs font-medium text-red-700">{errors.location}</p>}
          </Card>

          <Card>
            <SectionTitle number={2} title="Job details" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField
                label="Job name"
                required
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="e.g. Gearbox Export Crates — Batch 2"
                error={errors.name}
                className="sm:col-span-2 lg:col-span-3"
              />
              <SelectField label="Category" required value={form.categoryId} onChange={(e) => changeCategory(e.target.value)} options={jobCategories.map((c) => ({ value: c.id, label: c.name }))} />
              <SelectField label="Subcategory" value={form.subcategory} onChange={(e) => set({ subcategory: e.target.value })} options={category.subcategories.map((s) => s.name)} />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">Priority</span>
                <div className="flex rounded-[10px] bg-slate-200/70 p-[3px]" role="radiogroup" aria-label="Priority">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={form.priority === p}
                      onClick={() => set({ priority: p })}
                      className={cn('h-[34px] flex-1 rounded-lg text-[13px] font-semibold', form.priority === p ? 'bg-white text-ink shadow-sm' : 'text-muted')}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <TextField label="Start date" type="date" required value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
              <TextField label="Due date" type="date" required value={form.dueDate} onChange={(e) => set({ dueDate: e.target.value })} error={errors.dueDate} />
              <TextField label="Quantity / volume" value={form.quantity} onChange={(e) => set({ quantity: e.target.value })} placeholder="e.g. 6 crates · ~9 t" />
              <TextArea label="Description" value={form.description} onChange={(e) => set({ description: e.target.value })} className="sm:col-span-2 lg:col-span-3" placeholder="What needs to be done, materials, special handling…" />
            </div>
          </Card>

          <Card>
            <SectionTitle number={3} title="Service scope" subtitle="What PIQ is responsible for. Each service is tracked separately." />
            <div className="mb-4 flex flex-wrap gap-2">
              {SERVICE_SCOPES.map((scope) => (
                <Chip key={scope} active={form.scope === scope} onClick={() => changeScope(scope)}>
                  {scope}
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {SERVICES.map((service) => {
                const included = form.services.includes(service);
                return (
                  <div key={service} className={cn('flex items-center gap-3 rounded-xl border p-3', included ? 'border-brand-line bg-[#fffbf6]' : 'border-line')}>
                    <Checkbox label={<b>{service}</b>} checked={included} onChange={() => toggleService(service)} className="flex-1" />
                    {included && (
                      <SelectControl
                        aria-label={`${service} owner`}
                        value={ownerFor(service)}
                        onChange={(e) => set({ owners: { ...form.owners, [service]: e.target.value } })}
                        options={members.filter((m) => m.status === 'Active').map((m) => ({ value: m.id, label: m.name }))}
                        className="h-9 w-40 text-[13px]"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {errors.services && <p className="mt-2 text-xs font-medium text-red-700">{errors.services}</p>}
          </Card>

          <Card>
            <SectionTitle
              number={4}
              title="Vendors for this job"
              subtitle={`Suggested by category and nearest to ${unit?.name}.`}
              action={<Link to="/vendors" className="text-[13px] font-semibold text-brand-ink hover:underline">Open vendor list</Link>}
            />
            <div className="flex flex-col gap-3">
              {vendorRows.map(({ category: vc, options, chosen }) => {
                const vendor = options.find((o) => o.id === chosen);
                return (
                  <div key={vc.id} className="grid grid-cols-1 items-center gap-2 rounded-xl border border-line p-3 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
                    <b>{vc.name}</b>
                    {options.length ? (
                      <SelectControl
                        aria-label={`${vc.name} vendor`}
                        value={chosen}
                        onChange={(e) => set({ vendorChoices: { ...form.vendorChoices, [vc.id]: e.target.value } })}
                        options={[{ value: '', label: 'Not needed' }, ...options.map((o) => ({ value: o.id, label: `${o.name} · ${o.city}${o.status === 'Preferred' ? ' · Preferred' : ''}` }))]}
                      />
                    ) : (
                      <span className="text-[13px] text-muted">No active vendors in this category</span>
                    )}
                    <span className="text-[12.5px] text-muted">{vendor ? `${vendor.leadDays} day lead time` : '—'}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle number={5} title="Workflow, unit & team" action={<Link to="/workflows" className="text-[13px] font-semibold text-brand-ink hover:underline">Manage templates</Link>} />
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Workflow template"
                required
                value={form.templateId}
                onChange={(e) => set({ templateId: e.target.value })}
                options={workflowTemplates.map((t) => ({ value: t.id, label: `${t.name} · ${t.stages.length} stages` }))}
              />
              <SelectField
                label="Assigned unit"
                required
                value={unitId}
                onChange={(e) => set({ unitId: e.target.value })}
                options={rankedUnits.map((u, i) => ({ value: u.id, label: `${u.name}${u.distance !== null ? ` · ${u.distance} km` : ''}${i === 0 ? ' (nearest)' : ''}` }))}
              />
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {template?.stages.map((stage, i) => (
                <Tag key={stage.id}>
                  {i + 1} {stage.name}
                </Tag>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
              <AvatarStack people={lookups.membersFor(teamIds)} max={5} size="sm" />
              <span className="text-[13px]">{teamIds.length} {teamIds.length === 1 ? 'person' : 'people'} assigned from service owners</span>
              <span className="ml-auto flex items-center gap-1 text-[12.5px] text-muted">
                <MapPin className="size-3.5" aria-hidden="true" /> {unit?.name}
              </span>
            </div>
          </Card>

          <Card>
            <SectionTitle number={6} title="Internal notes" />
            <TextArea label="Notes for the team" value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} placeholder="Visible to staff only. You can upload photos and drawings from the job page after creating it." />
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-5.5 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader title="Job summary" action={<StatusBadge value="Upcoming" />} />
            <dl className="flex flex-col gap-3.5">
              {[
                ['Client · location', `${client?.name} · ${location?.name ?? '—'}`],
                ['Job', form.name || '—'],
                ['Dates', `${form.startDate} → ${form.dueDate} · ${form.priority}`],
                ['Scope', `${form.scope} · ${form.services.length} service${form.services.length === 1 ? '' : 's'}`],
                ['Vendors', `${vendorRows.filter((r) => r.chosen).length} of ${vendorRows.length} categories chosen`],
                ['Unit & workflow', `${unit?.name} · ${template?.name}`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <CardHeader title="Checklist" action={<span className="text-[13px] font-semibold">{checklist.filter((c) => c.done).length} / {checklist.length}</span>} />
            <ul className="flex flex-col gap-2.5">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-[13px]">
                  <span className={cn('grid size-5.5 place-items-center rounded-md', item.done ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400')}>
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className={item.done ? '' : 'text-muted'}>{item.label}</span>
                </li>
              ))}
            </ul>
            <Button variant="primary" fullWidth className="mt-4" onClick={handleCreate}>
              Create job
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
