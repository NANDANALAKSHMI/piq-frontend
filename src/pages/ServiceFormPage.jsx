import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layers, MessageSquareText, X } from 'lucide-react';
import StickyPageHeader from '../components/common/StickyPageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Toggle from '../components/common/Toggle.jsx';
import { StatusBadge } from '../components/common/Badge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { TextArea, TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { ListInput } from '../features/services/ServiceModals.jsx';
import { newId, sameName } from '../features/services/serviceHelpers.js';
import useServices from '../hooks/useServices.js';
import { cn } from '../utils/formatters.js';
import { SERVICE_ROW, SERVICE_SURFACE } from '../features/services/serviceTone.js';

/** Matches the cards on the Services and service detail pages. */
const PANEL = SERVICE_SURFACE;

const EMPTY = { name: '', description: '', subServices: [], questions: [], active: true };

const STATUSES = [
  { value: true, label: 'Active', help: 'Can be picked when creating projects and vendors.' },
  { value: false, label: 'Inactive', help: 'Hidden from new projects. Existing projects keep it.' },
];

/** A row in the sub-service / question lists: optional number, text, optional switch, remove. */
function ItemRow({ index, children, active, onToggle, toggleLabel, onRemove, removeLabel }) {
  return (
    <li className={cn(SERVICE_ROW, 'flex items-center gap-2.5 py-1.5 pl-3 pr-1.5')}>
      {index !== undefined ? (
        <span className="w-6 shrink-0 text-[12.5px] font-semibold text-muted">Q{index + 1}.</span>
      ) : (
        <span className={cn('ml-1 size-2 shrink-0 rounded-full', active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/20')} aria-hidden="true" />
      )}
      <span className={cn('min-w-0 flex-1 break-words text-sm', active === false && 'text-muted line-through')}>{children}</span>
      {onToggle && <Toggle size="sm" checked={active} label={toggleLabel} onChange={onToggle} />}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        title="Remove"
        className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-red-50 hover:text-red-700"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

function ServiceForm({ initial, serviceId, services, addService, updateService }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const editing = Boolean(serviceId);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const duplicate = services.some((s) => s.id !== serviceId && sameName(s.name, form.name));

  const handleSave = async () => {
    if (saving) return;
    const name = form.name.trim();
    const problem = !name ? 'Service name is required.' : duplicate ? 'A service with this name already exists.' : '';
    setError(problem);
    if (problem) {
      showToast('Please fix the highlighted fields.', { tone: 'info' });
      return;
    }
    const draft = { ...form, name, description: form.description.trim() };
    setSaving(true);
    try {
      const id = editing ? (await updateService(serviceId, draft), serviceId) : await addService(draft);
      showToast(editing ? `${name} updated.` : `${name} added to services.`);
      navigate(`/services/${id}`);
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col gap-5.5">
      <StickyPageHeader
        icon={Layers}
        title={editing ? `Edit ${initial.name}` : 'Add service'}
        subtitle={editing ? 'Update this service, its sub-services and questions.' : 'Something you offer, the sub-services under it, and what to ask.'}
        breadcrumbs={[{ label: 'Services', to: '/services' }, ...(editing ? [{ label: initial.name, to: `/services/${serviceId}` }] : []), { label: editing ? 'Edit' : 'Add service' }]}
        badge={editing ? undefined : 'Draft'}
        cancelTo={editing ? `/services/${serviceId}` : '/services'}
        submitLabel="Save service"
        submitting={saving}
        onSubmit={handleSave}
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-5.5 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-5.5">
          <Card className={PANEL}>
            <CardHeader title="Basic information" />
            <div className="grid gap-4">
              <TextField
                label="Service name"
                required
                autoFocus={!editing}
                value={form.name}
                onChange={(e) => {
                  set('name', e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Packing"
                error={error || (duplicate ? 'A service with this name already exists.' : undefined)}
              />
              <TextArea label="Description" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What this service covers" />
            </div>
          </Card>

          <Card className={PANEL}>
            <CardHeader title="Status" />
            <div role="radiogroup" aria-label="Service status" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {STATUSES.map(({ value, label, help }) => (
                <label
                  key={label}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
                    form.active === value ? 'border-2 border-brand bg-brand-tint' : 'border-line hover:border-slate-300',
                  )}
                >
                  <input type="radio" name="service-status" checked={form.active === value} onChange={() => set('active', value)} className="mt-0.5 size-4 accent-brand" />
                  <span>
                    <StatusBadge value={label} />
                    <span className="mt-1.5 block text-[12.5px] text-muted">{help}</span>
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-5.5">
          <Card className={PANEL}>
            <CardHeader
              title="Sub-services"
              subtitle="The parts of this service. Switch one off to stop it being picked."
            />
            <ListInput
              label="New sub-service"
              placeholder="Type a sub-service, then press Enter"
              takenNames={form.subServices.map((s) => s.name)}
              onAdd={(text) => set('subServices', [...form.subServices, { id: newId('sub'), name: text, description: '', active: true }])}
            />
            {form.subServices.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-1.5">
                {form.subServices.map((sub) => (
                  <ItemRow
                    key={sub.id}
                    active={sub.active}
                    toggleLabel={`${sub.name} active`}
                    onToggle={(active) => set('subServices', form.subServices.map((x) => (x.id === sub.id ? { ...x, active } : x)))}
                    removeLabel={`Remove ${sub.name}`}
                    onRemove={() => set('subServices', form.subServices.filter((x) => x.id !== sub.id))}
                  >
                    {sub.name}
                  </ItemRow>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-line dark:border-white/10 px-3 py-4 text-center text-[13px] text-muted">No sub-services yet.</p>
            )}
          </Card>

          <Card className={PANEL}>
            <CardHeader
              title="Questions"
              subtitle="Optional. Asked when this service is added to a project."
            />
            <ListInput
              label="New question"
              placeholder="Type a question, then press Enter"
              takenNames={form.questions.map((q) => q.text)}
              onAdd={(text) => set('questions', [...form.questions, { id: newId('q'), text, active: true }])}
            />
            {form.questions.length > 0 ? (
              <ol className="mt-3 flex flex-col gap-1.5">
                {form.questions.map((q, index) => (
                  <ItemRow
                    key={q.id}
                    index={index}
                    removeLabel={`Remove question ${index + 1}`}
                    onRemove={() => set('questions', form.questions.filter((x) => x.id !== q.id))}
                  >
                    {q.text}
                  </ItemRow>
                ))}
              </ol>
            ) : (
              <p className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-line dark:border-white/10 px-3 py-4 text-[13px] text-muted">
                <MessageSquareText className="size-4" aria-hidden="true" />
                No questions yet.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/** /services/new and /services/:serviceId/edit */
export default function ServiceFormPage() {
  const { serviceId } = useParams();
  const { services, loading, addService, updateService } = useServices();
  const props = { services, addService, updateService };

  if (loading) return <p className="py-10 text-center text-[13px] text-muted">Loading service…</p>;
  if (!serviceId) return <ServiceForm initial={EMPTY} {...props} />;

  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return (
      <EmptyState
        icon={Layers}
        title="Service not found"
        description="This service may have been deleted."
        action={<Button to="/services" variant="primary">Back to services</Button>}
      />
    );
  }
  const { name, description, subServices, questions, active } = service;
  return <ServiceForm key={serviceId} initial={{ name, description, subServices, questions, active }} serviceId={serviceId} {...props} />;
}
