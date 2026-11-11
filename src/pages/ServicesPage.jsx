import { useState } from 'react';
import { ChevronDown, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button, { IconButton } from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Toggle from '../components/common/Toggle.jsx';
import Modal from '../components/common/Modal.jsx';
import { Tag } from '../components/common/Badge.jsx';
import { TextArea, TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import useServices from '../hooks/useServices.js';
import { cn } from '../utils/formatters.js';

const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
const newSubServiceId = () => `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** One text box + Add button. Type a name, press Enter, keep typing the next one. */
function QuickAdd({ label, placeholder, takenNames, disabled, onAdd }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const duplicate = takenNames.some((taken) => sameName(taken, name));

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim() || duplicate || saving) return;
    setSaving(true);
    const added = await onAdd(name.trim());
    setSaving(false);
    if (added) setName('');
  };

  return (
    <form onSubmit={submit} className="flex items-start gap-2.5">
      <TextField
        aria-label={label}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        error={duplicate ? 'This name is already in the list.' : undefined}
        className="flex-1"
      />
      <Button type="submit" variant="primary" icon={Plus} disabled={disabled || !name.trim() || duplicate || saving}>
        Add
      </Button>
    </form>
  );
}

/** Add or edit popup: a name, plus a description when `withDescription` is set (services). */
function DetailsModal({ title, saveLabel = 'Save', initialName = '', initialDescription = '', withDescription = false, takenNames, onClose, onSave }) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const duplicate = takenNames.some((taken) => sameName(taken, name));

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim() || duplicate || saving) return;
    setSaving(true);
    const saved = await onSave({ name: name.trim(), description: description.trim() });
    if (!saved) setSaving(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="details-form" disabled={!name.trim() || duplicate || saving}>
            {saving ? 'Saving…' : saveLabel}
          </Button>
        </>
      }
    >
      <form id="details-form" onSubmit={submit} className="grid gap-4">
        <TextField
          label={withDescription ? 'Service name' : 'Name'}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={withDescription ? 'e.g. Packing' : undefined}
          error={duplicate ? 'This name is already in the list.' : undefined}
        />
        {withDescription && (
          <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this service covers" />
        )}
      </form>
    </Modal>
  );
}

function ConfirmDeleteModal({ title, message, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    const done = await onConfirm();
    if (!done) setDeleting(false);
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" icon={Trash2} disabled={deleting} onClick={confirm}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
    >
      <p className="text-sm">{message}</p>
    </Modal>
  );
}

/** Toggle + rename + delete, shared by service rows and sub-service rows. */
function RowActions({ name, active, onToggle, onRename, onDelete }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Toggle checked={active} label={`${name} active`} onChange={onToggle} />
      <IconButton icon={Pencil} label={`Edit ${name}`} className="size-9 border-transparent bg-transparent" onClick={onRename} />
      <IconButton icon={Trash2} label={`Delete ${name}`} className="size-9 border-transparent bg-transparent text-red-700" onClick={onDelete} />
    </div>
  );
}

export default function ServicesPage() {
  const { services, loading, error, addService, updateService, removeService } = useServices();
  const { showToast } = useToast();
  const [openId, setOpenId] = useState(null);
  /** { type: 'add' } or { type: 'edit' | 'delete', service, subService? } */
  const [modal, setModal] = useState(null);
  const closeModal = () => setModal(null);

  /** Runs a save; shows a toast on failure. Resolves to the result (or true), or false if it failed. */
  const run = async (action) => {
    try {
      return (await action()) ?? true;
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      return false;
    }
  };

  const createService = async (values) => {
    const id = await run(() => addService(values));
    if (!id) return false;
    setOpenId(id); // open it straight away so sub-services can be typed in
    closeModal();
    return true;
  };

  const saveSubServices = (service, subServices) => run(() => updateService(service.id, { subServices }));

  /** Modals work on the live record, so a change from another tab can't be overwritten by stale data. */
  const modalService = modal?.service && services.find((s) => s.id === modal.service.id);
  const modalTarget = modal?.subService ?? modal?.service;

  const saveEdit = async ({ name, description }) => {
    const { subService } = modal;
    const service = modalService;
    const saved = subService
      ? await saveSubServices(service, service.subServices.map((s) => (s.id === subService.id ? { ...s, name } : s)))
      : await run(() => updateService(service.id, { name, description }));
    if (saved) closeModal();
    return saved;
  };

  const confirmDelete = async () => {
    const { subService } = modal;
    const service = modalService;
    const done = subService
      ? await saveSubServices(service, service.subServices.filter((s) => s.id !== subService.id))
      : await run(() => removeService(service.id));
    if (done) {
      showToast(`${(subService ?? service).name} deleted.`);
      closeModal();
    }
    return done;
  };

  return (
    <div className="flex max-w-3xl flex-col gap-5.5">
      <PageHeader
        title="Services"
        subtitle="Add a service, then open it to add its sub-services."
        actions={
          <Button variant="primary" icon={Plus} disabled={loading} onClick={() => setModal({ type: 'add' })}>
            Add service
          </Button>
        }
      />

      {error && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div className="text-[13px]">
            <p className="font-semibold text-amber-900">Services aren’t connected yet</p>
            <p className="mt-0.5 text-amber-800">{error}</p>
          </div>
        </div>
      )}

      <Card padded={false}>
        {loading && (
          <div className="flex flex-col gap-2.5 p-4" aria-busy="true" aria-label="Loading services">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-[10px] bg-slate-100" />
            ))}
          </div>
        )}

        {!loading && services.length === 0 && (
          <p className="px-4 py-10 text-center text-[13px] text-muted">No services yet. Click “Add service” to create the first one.</p>
        )}

        {!loading && services.length > 0 && (
          <ul aria-label="Services">
            {services.map((service) => {
              const open = service.id === openId;
              return (
                <li key={service.id} className="border-t border-line first:border-t-0">
                  <div className="flex items-center gap-2 px-4 py-2.5">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : service.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1.5 text-left"
                    >
                      <ChevronDown className={cn('size-4 shrink-0 text-muted transition-transform', !open && '-rotate-90')} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2.5">
                          <span className="truncate font-semibold">{service.name}</span>
                          <span className="shrink-0 text-[12.5px] text-muted">{plural(service.subServices.length, 'sub-service')}</span>
                          {!service.active && <Tag>Inactive</Tag>}
                        </span>
                        {service.description && <span className="block truncate text-[12.5px] text-muted">{service.description}</span>}
                      </span>
                    </button>
                    <RowActions
                      name={service.name}
                      active={service.active}
                      onToggle={(active) => run(() => updateService(service.id, { active }))}
                      onRename={() => setModal({ type: 'edit', service })}
                      onDelete={() => setModal({ type: 'delete', service })}
                    />
                  </div>

                  {open && (
                    <div className="bg-slate-50/70 px-4 pb-4 pl-10.5 pt-3">
                      <h3 className="text-xs font-semibold text-muted">Sub-services of {service.name}</h3>
                      {service.subServices.length > 0 && (
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {service.subServices.map((sub) => (
                            <li key={sub.id} className="flex items-center gap-2 rounded-[10px] border border-line bg-white py-1 pl-3.5 pr-1.5">
                              <span className={cn('min-w-0 flex-1 truncate', !sub.active && 'text-muted')}>{sub.name}</span>
                              <RowActions
                                name={sub.name}
                                active={sub.active}
                                onToggle={(active) => saveSubServices(service, service.subServices.map((s) => (s.id === sub.id ? { ...s, active } : s)))}
                                onRename={() => setModal({ type: 'edit', service, subService: sub })}
                                onDelete={() => setModal({ type: 'delete', service, subService: sub })}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-2.5">
                        <QuickAdd
                          label={`New sub-service for ${service.name}`}
                          placeholder="New sub-service name"
                          takenNames={service.subServices.map((s) => s.name)}
                          onAdd={(name) => saveSubServices(service, [...service.subServices, { id: newSubServiceId(), name, description: '', active: true }])}
                        />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {modal?.type === 'add' && (
        <DetailsModal title="Add service" saveLabel="Add service" withDescription takenNames={services.map((x) => x.name)} onClose={closeModal} onSave={createService} />
      )}

      {modal?.type === 'edit' && modalService && (
        <DetailsModal
          title={`Edit ${modalTarget.name}`}
          initialName={modalTarget.name}
          initialDescription={modalTarget.description}
          withDescription={!modal.subService}
          takenNames={(modal.subService ? modalService.subServices : services).filter((x) => x.id !== modalTarget.id).map((x) => x.name)}
          onClose={closeModal}
          onSave={saveEdit}
        />
      )}

      {modal?.type === 'delete' && modalService && (
        <ConfirmDeleteModal
          title={`Delete ${modalTarget.name}?`}
          message={
            modal.subService
              ? `It will be removed from ${modalService.name}. This can’t be undone.`
              : modalService.subServices.length
                ? `This also deletes its ${plural(modalService.subServices.length, 'sub-service')}. It can’t be undone.`
                : 'This can’t be undone.'
          }
          onClose={closeModal}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
