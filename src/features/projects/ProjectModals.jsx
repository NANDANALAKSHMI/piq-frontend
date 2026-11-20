import { useState } from 'react';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import { SelectField, TextArea, TextField } from '../../components/common/FormFields.jsx';
import { PRIORITIES, PROJECT_STATUSES } from '../../data/constants.js';

/** `onSave` returns a promise resolving to true when saved, so the button can show "Saving…". */
export function StatusModal({ project, onClose, onSave }) {
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);
  return (
    <Modal
      open
      onClose={onClose}
      title="Update status"
      description={`${project.id} · ${project.name}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={status === project.status || saving}
            onClick={async () => {
              setSaving(true);
              if (!(await onSave(status))) setSaving(false);
            }}
          >
            {saving ? 'Saving…' : 'Save status'}
          </Button>
        </>
      }
    >
      <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={PROJECT_STATUSES} />
    </Modal>
  );
}

export function EditProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project.name,
    priority: project.priority,
    startDate: project.startDate,
    dueDate: project.dueDate,
    quantity: project.quantity,
    description: project.description,
  });
  const [saving, setSaving] = useState(false);
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  const invalidDates = Boolean(form.startDate && form.dueDate && form.dueDate < form.startDate);

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit project"
      description={project.id}
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!form.name.trim() || invalidDates || saving}
            onClick={async () => {
              setSaving(true);
              if (!(await onSave({ ...form, name: form.name.trim(), quantity: form.quantity.trim(), description: form.description.trim() }))) setSaving(false);
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Project name" value={form.name} onChange={update('name')} required className="sm:col-span-2" />
        <SelectField label="Priority" value={form.priority} onChange={update('priority')} options={PRIORITIES} />
        <TextField label="Quantity / volume" value={form.quantity} onChange={update('quantity')} placeholder="e.g. 6 crates · ~9 t" />
        <TextField label="Start date" type="date" value={form.startDate} onChange={update('startDate')} />
        <TextField label="Due date" type="date" value={form.dueDate} onChange={update('dueDate')} error={invalidDates ? 'Due date must be after the start date.' : ''} />
        <TextArea label="Description" value={form.description} onChange={update('description')} className="sm:col-span-2" />
      </div>
    </Modal>
  );
}
