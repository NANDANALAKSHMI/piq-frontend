import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, FolderPlus, Users } from 'lucide-react';
import EmptyState from '../components/common/EmptyState.jsx';
import StickyPageHeader from '../components/common/StickyPageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import { SelectControl, SelectField, TextArea, TextField } from '../components/common/FormFields.jsx';
import { Chip } from '../components/common/Tabs.jsx';
import { AvatarStack } from '../components/common/Avatar.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import useServices from '../hooks/useServices.js';
import { PRIORITIES } from '../data/constants.js';
import { suggestVendors } from '../features/projects/projectFormHelpers.js';
import { cn, daysFromToday } from '../utils/formatters.js';

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

const placeLine = (loc) => [loc.address, loc.city, loc.district, loc.state].filter(Boolean).join(', ') || '—';

function AddProjectForm() {
  const { clients, members, vendors, addProject } = useAppData();
  const lookups = useLookups();
  const { services, loading: servicesLoading } = useServices();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialClient = clients.find((c) => c.id === searchParams.get('client')) ?? null;
  const primaryOf = (client) => client?.locations.find((l) => l.primary)?.id ?? client?.locations[0]?.id ?? '';

  const [form, setForm] = useState({
    clientId: initialClient?.id ?? '',
    locationId: primaryOf(initialClient),
    name: '',
    priority: 'Medium',
    startDate: daysFromToday(0),
    dueDate: daysFromToday(14),
    quantity: '',
    description: '',
    serviceIds: [],
    subServiceIds: [],
    owners: {},
    vendorChoices: {},
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const client = clients.find((c) => c.id === form.clientId);
  const activeMembers = members.filter((m) => m.status === 'Active');
  const offered = useMemo(() => services.filter((s) => s.active), [services]);
  const chosen = offered.filter((s) => form.serviceIds.includes(s.id));

  const ownerFor = (serviceId) => form.owners[serviceId] ?? activeMembers[0]?.id ?? '';

  /** One row per chosen service that has active vendors; nothing is pre-chosen. */
  const vendorRows = chosen
    .map((service) => ({ service, options: suggestVendors(vendors, service.id), chosen: form.vendorChoices[service.id] ?? '' }))
    .filter((row) => row.options.length);

  const teamIds = [...new Set(chosen.map((s) => ownerFor(s.id)))].filter(Boolean);

  /** Removing a service also clears its sub-services, owner and vendor choice. */
  const changeServices = (serviceIds) =>
    setForm((current) => {
      const allowed = new Set(services.filter((s) => serviceIds.includes(s.id)).flatMap((s) => s.subServices.map((sub) => sub.id)));
      return { ...current, serviceIds, subServiceIds: current.subServiceIds.filter((id) => allowed.has(id)) };
    });

  const toggleSub = (subId) =>
    set({ subServiceIds: form.subServiceIds.includes(subId) ? form.subServiceIds.filter((id) => id !== subId) : [...form.subServiceIds, subId] });

  const validate = () => {
    const next = {};
    if (!form.clientId) next.client = 'Choose a client.';
    else if (!form.locationId) next.location = 'Choose where the project happens.';
    if (!form.name.trim()) next.name = 'Give the project a name.';
    if (!form.startDate) next.startDate = 'Choose a start date.';
    if (!form.dueDate) next.dueDate = 'Choose a due date.';
    else if (form.dueDate < form.startDate) next.dueDate = 'Due date must be after the start date.';
    if (!chosen.length) next.services = 'Pick at least one service.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };


  const handleCreate = async () => {
    if (saving) return;
    if (!validate()) {
      showToast('Please fix the highlighted fields.', { tone: 'info' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      const id = await addProject({
        name: form.name.trim(),
        clientId: form.clientId,
        locationId: form.locationId,
        status: 'Upcoming',
        priority: form.priority,
        startDate: form.startDate,
        dueDate: form.dueDate,
        quantity: form.quantity.trim(),
        description: form.description.trim(),
        notes: form.notes.trim(),
        teamIds,
        vendorIds: vendorRows.map((r) => r.chosen).filter(Boolean),
        services: chosen.map((s) => ({
          serviceId: s.id,
          name: s.name,
          subServiceIds: s.subServices.filter((sub) => form.subServiceIds.includes(sub.id)).map((sub) => sub.id),
          ownerId: ownerFor(s.id),
          progress: 0,
        })),
      });
      showToast(`${id} created.`);
      navigate(`/projects/${id}`);
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col gap-5.5">
      <StickyPageHeader
        icon={FolderPlus}
        title="Create new project"
        subtitle="Set up project details, services and team assignments."
        breadcrumbs={[{ label: 'Projects', to: '/projects' }, { label: 'New project' }]}
        badge="Draft"
        cancelTo="/projects"
        submitLabel="Create project"
        submittingLabel="Creating…"
        submitting={saving}
        disabled={servicesLoading}
        onSubmit={handleCreate}
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-5.5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5.5">
        <Card>
          <SectionTitle number={1} title="Client & location" action={<Link to="/clients/new" className="text-[13px] font-semibold text-brand-ink hover:underline">+ New client</Link>} />
          <SelectField
            label="Client"
            required
            value={form.clientId}
            onChange={(e) => {
              const next = clients.find((c) => c.id === e.target.value);
              set({ clientId: e.target.value, locationId: primaryOf(next) });
            }}
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select client"
            error={errors.client}
            className="mb-4 sm:max-w-sm"
          />
          {client && (
            <>
              <p className="mb-2 text-xs font-semibold text-muted">
                Project location <span className="text-red-600">*</span>
              </p>
              {client.locations.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Project location">
                  {client.locations.map((loc) => {
                    const selected = loc.id === form.locationId;
                    return (
                      <label
                        key={loc.id}
                        className={cn(
                          'flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5 transition-colors',
                          selected ? 'border-2 border-brand bg-brand-tint' : 'border-line hover:border-slate-300',
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <b>{loc.name || loc.city || 'Location'}</b>
                          <input type="radio" name="location" checked={selected} onChange={() => set({ locationId: loc.id })} className="size-4.5 accent-navy" />
                        </span>
                        <span className="text-[12.5px] text-muted">{placeLine(loc)}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[13px] text-muted">
                  This client has no locations yet.{' '}
                  <Link to={`/clients/${client.id}`} className="font-semibold text-brand-ink hover:underline">
                    Open the client
                  </Link>{' '}
                  to add one.
                </p>
              )}
              {errors.location && <p className="mt-2 text-xs font-medium text-red-700">{errors.location}</p>}
            </>
          )}
        </Card>

        <Card>
          <SectionTitle number={2} title="Project details" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField
              label="Project name"
              required
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Gearbox Export Crates — Batch 2"
              error={errors.name}
              className="sm:col-span-2"
            />
            <TextField label="Quantity / volume" value={form.quantity} onChange={(e) => set({ quantity: e.target.value })} placeholder="e.g. 6 crates · ~9 t" />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted">Priority</span>
              <div className="flex rounded-[10px] bg-segment p-[3px]" role="radiogroup" aria-label="Priority">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={form.priority === p}
                    onClick={() => set({ priority: p })}
                    className={cn('h-[34px] flex-1 rounded-lg text-[13px] font-semibold', form.priority === p ? 'bg-surface text-ink shadow-sm' : 'text-muted')}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <TextField label="Start date" type="date" required value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} error={errors.startDate} />
            <TextField label="Due date" type="date" required value={form.dueDate} onChange={(e) => set({ dueDate: e.target.value })} error={errors.dueDate} />
            <TextArea label="Description" value={form.description} onChange={(e) => set({ description: e.target.value })} className="sm:col-span-2 lg:col-span-3" placeholder="What needs to be done, materials, special handling…" />
          </div>
        </Card>

        <Card>
          <SectionTitle
            number={3}
            title="Services"
            subtitle="Pick what this project needs — each one is tracked separately."
            action={<Link to="/services" className="text-[13px] font-semibold text-brand-ink hover:underline">Manage services</Link>}
          />
          {servicesLoading && <p className="text-[13px] text-muted">Loading services…</p>}
          {!servicesLoading && offered.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-[13px] text-muted">
              No services yet — add them on the{' '}
              <Link to="/services" className="font-semibold text-brand-ink hover:underline">
                Services page
              </Link>
              .
            </p>
          )}
          {offered.length > 0 && (
            <>
              <p className="mb-2.5 text-xs font-semibold text-muted">
                Tap the services this project needs <span className="text-red-600">*</span>
              </p>
              <ul className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {offered.map((service) => {
                  const selected = form.serviceIds.includes(service.id);
                  const subs = service.subServices.filter((sub) => sub.active);
                  return (
                    <li
                      key={service.id}
                      className={cn('rounded-xl border transition-colors', selected ? 'border-2 border-brand bg-brand-soft/50' : 'border-line bg-surface/60 hover:border-brand-line')}
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        onClick={() => changeServices(selected ? form.serviceIds.filter((id) => id !== service.id) : [...form.serviceIds, service.id])}
                        className="flex w-full items-center gap-3 rounded-xl p-3.5 text-left"
                      >
                        <span
                          className={cn(
                            'grid size-5 shrink-0 place-items-center rounded-md border',
                            selected ? 'border-navy bg-navy text-white' : 'border-slate-300 bg-surface text-transparent',
                          )}
                        >
                          <Check className="size-3.5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{service.name}</span>
                          {service.description && <span className="block truncate text-xs text-muted">{service.description}</span>}
                        </span>
                      </button>

                      {selected && (
                        <div className="flex flex-col gap-3 border-t border-brand-line/70 px-3.5 pb-3.5 pt-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-muted">Owner</span>
                            <SelectControl
                              aria-label={`${service.name} owner`}
                              value={ownerFor(service.id)}
                              onChange={(e) => set({ owners: { ...form.owners, [service.id]: e.target.value } })}
                              options={activeMembers.map((m) => ({ value: m.id, label: m.name }))}
                              placeholder={activeMembers.length ? undefined : 'No team members'}
                              className="h-9 w-48 text-[13px]"
                            />
                          </div>
                          {subs.length > 0 && (
                            <div>
                              <p className="mb-1.5 text-xs font-semibold text-muted">Include</p>
                              <div className="flex flex-wrap gap-2">
                                {subs.map((sub) => (
                                  <Chip key={sub.id} active={form.subServiceIds.includes(sub.id)} onClick={() => toggleSub(sub.id)}>
                                    {sub.name}
                                  </Chip>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {errors.services && <p className="mt-2 text-xs font-medium text-red-700">{errors.services}</p>}
        </Card>

        </div>

        <div className="flex min-w-0 flex-col gap-5.5 xl:sticky xl:top-0">
        <Card>
          <SectionTitle
            number={4}
            title="Vendors for this project"
            subtitle="Optional. Vendors offering the chosen services; preferred vendors first."
            action={<Link to="/vendors" className="text-[13px] font-semibold text-brand-ink hover:underline">Open vendor list</Link>}
          />
          <div className="flex flex-col gap-3">
            {vendorRows.length === 0 && (
              <p className="text-[13px] text-muted">{chosen.length ? 'No active vendors offer these services yet.' : 'Choose services to see matching vendors.'}</p>
            )}
            {vendorRows.map(({ service, options, chosen: vendorId }) => {
              const vendor = options.find((o) => o.id === vendorId);
              return (
                <div key={service.id} className="flex flex-col gap-2 rounded-xl border border-line bg-surface/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                  <b>{service.name}</b>
                  <span className="text-[12.5px] text-muted">{vendor ? [vendor.city, vendor.phone].filter(Boolean).join(' · ') : ''}</span>
                  </div>
                  <SelectControl
                    aria-label={`${service.name} vendor`}
                    value={vendorId}
                    onChange={(e) => set({ vendorChoices: { ...form.vendorChoices, [service.id]: e.target.value } })}
                    options={[{ value: '', label: 'Not needed' }, ...options.map((o) => ({ value: o.id, label: `${o.name} · ${o.city || '—'}${o.status === 'Preferred' ? ' · Preferred' : ''}` }))]}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionTitle number={5} title="Team & notes" />
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-subtle p-3">
            <AvatarStack people={lookups.membersFor(teamIds)} max={5} size="sm" />
            <span className="text-[13px]">
              {teamIds.length} {teamIds.length === 1 ? 'person' : 'people'} assigned from service owners
            </span>
          </div>
          <TextArea label="Internal notes" value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={3} placeholder="Visible to staff only." />
        </Card>
        </div>
      </div>
    </div>
  );
}

export default function AddProjectPage() {
  const { clients, clientsLoading } = useAppData();
  if (clientsLoading) return <p className="py-10 text-center text-[13px] text-muted">Loading clients…</p>;
  if (!clients.length) {
    return (
      <EmptyState
        icon={Users}
        title="Add a client first"
        description="Every project belongs to a client and one of its locations."
        action={<Button to="/clients/new" variant="primary">Add client</Button>}
      />
    );
  }
  return <AddProjectForm />;
}
