import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FolderPlus, Users } from 'lucide-react';
import EmptyState from '../components/common/EmptyState.jsx';
import StickyPageHeader from '../components/common/StickyPageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import { SelectControl, SelectField, TextArea, TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useServices from '../hooks/useServices.js';
import { PRIORITIES } from '../data/constants.js';
import { suggestVendors } from '../features/projects/projectFormHelpers.js';
import ServicePicker from '../features/projects/ServicePicker.jsx';
import QuickAddClientModal from '../features/projects/QuickAddClientModal.jsx';
import QuickAddServiceModal from '../features/services/QuickAddServiceModal.jsx';
import PeoplePicker from '../features/projects/PeoplePicker.jsx';
import { cn, daysFromToday } from '../utils/formatters.js';

function SectionTitle({ number, title, subtitle, action }) {
  return (
    <CardHeader
      title={
        <span className="flex items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-navy text-xs font-bold text-white dark:bg-brand dark:text-on-gold">{number}</span>
          {title}
        </span>
      }
      subtitle={subtitle}
      action={action}
    />
  );
}

const placeLine = (loc) => [loc.address, loc.city, loc.district, loc.state].filter(Boolean).join(', ') || '—';

/** The form's values for an existing project (Edit mode). */
function formFromProject(project, vendors) {
  return {
    clientId: project.clientId,
    locationId: project.locationId,
    name: project.name,
    priority: project.priority,
    startDate: project.startDate,
    dueDate: project.dueDate,
    quantity: project.quantity,
    description: project.description,
    serviceIds: project.services.map((s) => s.serviceId),
    subServiceIds: project.services.flatMap((s) => s.subServiceIds),
    owners: Object.fromEntries(project.services.map((s) => [s.serviceId, s.ownerId])),
    teamIds: project.teamIds,
    // The project stores vendors as a flat list: match each one to the service it supplies.
    vendorChoices: Object.fromEntries(
      project.services
        .map((s) => [s.serviceId, project.vendorIds.find((id) => vendors.find((v) => v.id === id)?.serviceIds.includes(s.serviceId))])
        .filter(([, vendorId]) => vendorId),
    ),
    notes: project.notes,
  };
}

/** Creates a project, or edits `project` when one is given. */
function AddProjectForm({ project }) {
  const editing = Boolean(project);
  const { clients, members, vendors, addProject, updateProject } = useAppData();
  const { services, loading: servicesLoading } = useServices();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialClient = editing ? null : clients.find((c) => c.id === searchParams.get('client')) ?? null;
  const primaryOf = (client) => client?.locations.find((l) => l.primary)?.id ?? client?.locations[0]?.id ?? '';

  const [form, setForm] = useState(() => (editing ? formFromProject(project, vendors) : {
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
    teamIds: [],
    vendorChoices: {},
    notes: '',
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  /** Pop-ups to add a client / service without leaving this page. */
  const [quickAdd, setQuickAdd] = useState(null);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const client = clients.find((c) => c.id === form.clientId);

  // A client added from the pop-up arrives a moment later: once it does, pick its main location too.
  useEffect(() => {
    if (client && !form.locationId) set({ locationId: primaryOf(client) });
  }, [client, form.locationId]);
  const activeMembers = members.filter((m) => m.status === 'Active');
  // A service switched off later stays pickable on a project that already has it.
  const offered = useMemo(() => services.filter((s) => s.active || project?.services.some((p) => p.serviceId === s.id)), [services, project]);
  const chosen = offered.filter((s) => form.serviceIds.includes(s.id));

  // With no per-service owner picker, each service is owned by the first assigned person (else the first active member).
  const ownerFor = (serviceId) => form.owners[serviceId] ?? form.teamIds[0] ?? activeMembers[0]?.id ?? '';

  /** One row per chosen service that has active vendors; nothing is pre-chosen. */
  const vendorRows = chosen
    .map((service) => ({ service, options: suggestVendors(vendors, service.id), chosen: form.vendorChoices[service.id] ?? '' }))
    .filter((row) => row.options.length);

  const teamIds = form.teamIds;

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
      const payload = {
        name: form.name.trim(),
        clientId: form.clientId,
        locationId: form.locationId,
        priority: form.priority,
        startDate: form.startDate,
        dueDate: form.dueDate,
        quantity: form.quantity.trim(),
        description: form.description.trim(),
        notes: form.notes.trim(),
        teamIds,
        vendorIds: vendorRows.map((r) => r.chosen).filter(Boolean),
        services: chosen.map((s) => {
          const existing = project?.services.find((p) => p.serviceId === s.id); // keeps the progress already recorded
          return {
            ...existing,
            serviceId: s.id,
            name: s.name,
            subServiceIds: s.subServices.filter((sub) => form.subServiceIds.includes(sub.id)).map((sub) => sub.id),
            ownerId: ownerFor(s.id),
            progress: existing?.progress ?? 0,
          };
        }),
      };
      if (editing) {
        await updateProject(project.id, payload);
        showToast('Project details saved.');
        navigate(`/projects/${project.id}`);
      } else {
        const id = await addProject({ ...payload, status: 'Upcoming' });
        showToast(`${id} created.`);
        navigate(`/projects/${id}`);
      }
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col gap-5.5">
      <StickyPageHeader
        icon={FolderPlus}
        title={editing ? `Edit ${project.id}` : 'Create new project'}
        subtitle={editing ? 'Change anything about this project. Progress already recorded is kept.' : 'Set up project details, services and team assignments.'}
        breadcrumbs={
          editing
            ? [{ label: 'Projects', to: '/projects' }, { label: project.id, to: `/projects/${project.id}` }, { label: 'Edit' }]
            : [{ label: 'Projects', to: '/projects' }, { label: 'New project' }]
        }
        badge={editing ? undefined : 'Draft'}
        cancelTo={editing ? `/projects/${project.id}` : '/projects'}
        submitLabel={editing ? 'Save changes' : 'Create project'}
        submittingLabel={editing ? 'Saving…' : 'Creating…'}
        submitting={saving}
        disabled={servicesLoading}
        onSubmit={handleCreate}
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-5.5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5.5">
        <Card>
          <SectionTitle number={1} title="Client & location" action={<button type="button" onClick={() => setQuickAdd('client')} className="text-[13px] font-semibold text-brand-ink hover:underline">+ New client</button>} />
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
                          <input type="radio" name="location" checked={selected} onChange={() => set({ locationId: loc.id })} className="size-4.5 accent-brand" />
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
          <SectionTitle
            number={2}
            title="Services"
            subtitle="Pick what this project needs — each one is tracked separately."
            action={<button type="button" onClick={() => setQuickAdd('service')} className="text-[13px] font-semibold text-brand-ink hover:underline">+ New service</button>}
          />
          {!servicesLoading && offered.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-[13px] text-muted">
              No services yet —{' '}
              <button type="button" onClick={() => setQuickAdd('service')} className="font-semibold text-brand-ink hover:underline">
                add your first service
              </button>
              .
            </p>
          )}
          {(servicesLoading || offered.length > 0) && (
            <ServicePicker
              services={offered}
              value={{ serviceIds: form.serviceIds, subServiceIds: form.subServiceIds }}
              onChange={({ serviceIds, subServiceIds }) => set({ serviceIds, subServiceIds })}
              loading={servicesLoading}
              error={errors.services}
              className="lg:max-w-2xl"
            />
          )}
          {!servicesLoading && offered.length === 0 && errors.services && <p className="mt-2 text-xs font-medium text-red-700">{errors.services}</p>}
        </Card>

        <Card>
          <SectionTitle number={3} title="Project details" />
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

        </div>

        <div className="flex min-w-0 flex-col gap-5.5 xl:sticky xl:top-0">
        <Card>
          <SectionTitle
            number={4}
            title="Vendors for this project"
            subtitle="Optional. Vendors offering the chosen services; preferred vendors first."
          />
          <div className="flex flex-col gap-3">
            {vendorRows.length === 0 && (
              <p className="text-[13px] text-muted">{chosen.length ? 'No active vendors offer these services yet.' : 'Choose services to see matching vendors.'}</p>
            )}
            {vendorRows.map(({ service, options, chosen: vendorId }) => {
              const vendor = options.find((o) => o.id === vendorId);
              return (
                <div key={service.id} className="app-row flex flex-col gap-2 rounded-xl border p-3">
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
          <SectionTitle number={5} title="Assign team" />
          <PeoplePicker
            people={activeMembers}
            value={form.teamIds}
            onChange={(ids) => set({ teamIds: ids })}
            hint="Add everyone who will work on this project. You can pick more than one person."
          />
        </Card>

        <Card>
          <SectionTitle number={6} title="Notes" />
          <TextArea label="Internal notes" value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={3} placeholder="Visible to staff only." />
        </Card>
        </div>
      </div>

      {quickAdd === 'client' && (
        <QuickAddClientModal
          onClose={() => setQuickAdd(null)}
          onCreated={(id) => {
            set({ clientId: id, locationId: '' }); // its main location is picked when the client arrives
            setQuickAdd(null);
          }}
        />
      )}
      {quickAdd === 'service' && (
        <QuickAddServiceModal
          onClose={() => setQuickAdd(null)}
          onCreated={(id) => {
            set({ serviceIds: [...new Set([...form.serviceIds, id])] });
            setQuickAdd(null);
          }}
        />
      )}
    </div>
  );
}

/** /projects/:projectId/edit */
export function EditProjectPage() {
  const { projectId } = useParams();
  const { projects, projectsLoading } = useAppData();
  if (projectsLoading) return <p className="py-10 text-center text-[13px] text-muted">Loading project…</p>;
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return (
      <EmptyState
        icon={Users}
        title={`Project ${projectId} not found`}
        description="It may have been removed, or the link is wrong."
        action={<Button to="/projects" variant="primary">Back to projects</Button>}
      />
    );
  }
  return <AddProjectForm key={project.id} project={project} />;
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
