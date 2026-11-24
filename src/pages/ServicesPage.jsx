import { useState } from 'react';
import { ChevronDown, Pencil, Plus, Trash2, TriangleAlert, X } from 'lucide-react';
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
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** The two lists inside a service: field on the service document, its label, and how an item is named. */
const LISTS = {
  subServices: { label: 'sub-service', title: (s) => `Sub-services of ${s.name}`, nameOf: (item) => item.name, prefix: 'sub' },
  questions: { label: 'question', title: (s) => `Questions for ${s.name}`, nameOf: (item) => item.text, prefix: 'q' },
};
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
function DetailsModal({ title, saveLabel = 'Save', nameLabel, initialName = '', initialDescription = '', initialQuestions, withDescription = false, takenNames, onClose, onSave }) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  /** Only services have questions; `undefined` hides the section (sub-services, questions). */
  const [questions, setQuestions] = useState(initialQuestions);
  const [draftQuestion, setDraftQuestion] = useState('');
  const duplicateQuestion = Boolean(questions?.some((q) => sameName(q.text, draftQuestion)));

  const addQuestion = () => {
    if (!draftQuestion.trim() || duplicateQuestion) return;
    setQuestions((list) => [...list, { id: newId('q'), text: draftQuestion.trim(), active: true }]);
    setDraftQuestion('');
  };
  const [saving, setSaving] = useState(false);
  const duplicate = takenNames.some((taken) => sameName(taken, name));

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim() || duplicate || saving) return;
    setSaving(true);
    const saved = await onSave({ name: name.trim(), description: description.trim(), ...(questions ? { questions } : {}) });
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
          label={nameLabel ?? (withDescription ? 'Service name' : 'Name')}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={withDescription ? 'e.g. Packing' : undefined}
          error={duplicate ? 'This name is already in the list.' : undefined}
        />
        {withDescription && (
          <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this service covers" />
        )}
        {questions && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted">Questions (optional)</span>
            {questions.length > 0 && (
              <ol className="flex flex-col gap-1.5">
                {questions.map((q, index) => (
                  <li key={q.id} className="flex items-center gap-2 rounded-[10px] border border-line py-1 pl-3 pr-1">
                    <span className="shrink-0 text-[12.5px] font-semibold text-muted">Q{index + 1}.</span>
                    <span className="min-w-0 flex-1 break-words py-1 text-sm">{q.text}</span>
                    <IconButton
                      icon={X}
                      label={`Remove question ${index + 1}`}
                      className="size-8 border-transparent bg-transparent"
                      onClick={() => setQuestions((list) => list.filter((x) => x.id !== q.id))}
                    />
                  </li>
                ))}
              </ol>
            )}
            <div className="flex items-start gap-2">
              <TextField
                aria-label="New question"
                value={draftQuestion}
                onChange={(e) => setDraftQuestion(e.target.value)}
                onKeyDown={(e) => {
                  // Enter adds the question instead of submitting the whole form.
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addQuestion();
                  }
                }}
                placeholder="Type a question, then press Enter"
                error={duplicateQuestion ? 'This question is already in the list.' : undefined}
                className="flex-1"
              />
              <Button icon={Plus} disabled={!draftQuestion.trim() || duplicateQuestion} onClick={addQuestion}>
                Add
              </Button>
            </div>
          </div>
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
  /** { type: 'add' } or { type: 'edit' | 'delete', service, list?, item? } — `list` is 'subServices' or 'questions'. */
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

  /** Saves a whole list (sub-services or questions) on a service. */
  const saveList = (service, list, items) => run(() => updateService(service.id, { [list]: items }));

  /** Modals work on the live record, so a change from another tab can't be overwritten by stale data. */
  const modalService = modal?.service && services.find((s) => s.id === modal.service.id);
  const modalItem = modal?.item;
  const modalName = modalItem ? LISTS[modal.list].nameOf(modalItem) : modal?.service?.name;

  const saveEdit = async ({ name, description, questions }) => {
    const { list, item } = modal;
    const service = modalService;
    const field = list === 'questions' ? 'text' : 'name';
    const saved = item
      ? await saveList(service, list, service[list].map((x) => (x.id === item.id ? { ...x, [field]: name } : x)))
      : await run(() => updateService(service.id, { name, description, questions }));
    if (saved) closeModal();
    return saved;
  };

  const confirmDelete = async () => {
    const { list, item } = modal;
    const service = modalService;
    const done = item ? await saveList(service, list, service[list].filter((x) => x.id !== item.id)) : await run(() => removeService(service.id));
    if (done) {
      showToast(item ? `${LISTS[list].label[0].toUpperCase()}${LISTS[list].label.slice(1)} deleted.` : `${service.name} deleted.`);
      closeModal();
    }
    return done;
  };

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Services"
        subtitle="Add a service, then open it to add its sub-services and questions."
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
                    <div className="grid grid-cols-1 gap-5 bg-slate-50/70 px-4 pb-4 pl-10.5 pt-3 lg:grid-cols-2">
                      {['subServices', 'questions'].map((list) => {
                        const { label, title, nameOf, prefix } = LISTS[list];
                        const items = service[list];
                        return (
                          <section key={list} aria-label={title(service)}>
                            <h3 className="text-xs font-semibold text-muted">{title(service)}</h3>
                            {items.length > 0 && (
                              <ul className="mt-2 flex flex-col gap-1.5">
                                {items.map((item, index) => (
                                  <li key={item.id} className="flex items-center gap-2 rounded-[10px] border border-line bg-white py-1 pl-3.5 pr-1.5">
                                    {list === 'questions' && <span className="shrink-0 text-[12.5px] font-semibold text-muted">Q{index + 1}.</span>}
                                    <span className={cn('min-w-0 flex-1', list === 'questions' ? 'break-words py-1' : 'truncate', !item.active && 'text-muted')}>{nameOf(item)}</span>
                                    <RowActions
                                      name={nameOf(item)}
                                      active={item.active}
                                      onToggle={(active) => saveList(service, list, items.map((x) => (x.id === item.id ? { ...x, active } : x)))}
                                      onRename={() => setModal({ type: 'edit', service, list, item })}
                                      onDelete={() => setModal({ type: 'delete', service, list, item })}
                                    />
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="mt-2.5">
                              <QuickAdd
                                label={`New ${label} for ${service.name}`}
                                placeholder={list === 'questions' ? 'Type a question, e.g. What are the item dimensions?' : 'New sub-service name'}
                                takenNames={items.map(nameOf)}
                                onAdd={(text) =>
                                  saveList(service, list, [
                                    ...items,
                                    list === 'questions' ? { id: newId(prefix), text, active: true } : { id: newId(prefix), name: text, description: '', active: true },
                                  ])
                                }
                              />
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {modal?.type === 'add' && (
        <DetailsModal title="Add service" saveLabel="Add service" withDescription initialQuestions={[]} takenNames={services.map((x) => x.name)} onClose={closeModal} onSave={createService} />
      )}

      {modal?.type === 'edit' && modalService && (
        <DetailsModal
          title={modalItem ? `Edit ${LISTS[modal.list].label}` : `Edit ${modalName}`}
          nameLabel={modal.list === 'questions' ? 'Question' : undefined}
          initialName={modalName}
          initialDescription={modalItem ? '' : modalService.description}
          initialQuestions={modalItem ? undefined : modalService.questions}
          withDescription={!modalItem}
          takenNames={(modalItem ? modalService[modal.list].map(LISTS[modal.list].nameOf) : services.map((x) => x.name)).filter((n) => n !== modalName)}
          onClose={closeModal}
          onSave={saveEdit}
        />
      )}

      {modal?.type === 'delete' && modalService && (
        <ConfirmDeleteModal
          title={modalItem ? `Delete this ${LISTS[modal.list].label}?` : `Delete ${modalName}?`}
          message={
            modalItem
              ? `“${modalName}” will be removed from ${modalService.name}. This can’t be undone.`
              : modalService.subServices.length || modalService.questions.length
                ? `This also deletes its ${plural(modalService.subServices.length, 'sub-service')} and ${plural(modalService.questions.length, 'question')}. It can’t be undone.`
                : 'This can’t be undone.'
          }
          onClose={closeModal}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
