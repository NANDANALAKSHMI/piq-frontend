import { useState } from 'react';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import { SelectField, TextArea, TextField } from '../../components/common/FormFields.jsx';
import { JOB_STATUSES, PRIORITIES } from '../../data/constants.js';

export function StatusModal({ open, job, onClose, onSave }) {
  const [status, setStatus] = useState(job.status);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update status"
      description={`${job.id} · ${job.name}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(status)} disabled={status === job.status}>
            Save status
          </Button>
        </>
      }
    >
      <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={JOB_STATUSES} />
      <p className="mt-3 text-[13px] text-muted">To move the job forward through its workflow, use “Move to next stage” instead.</p>
    </Modal>
  );
}

export function EditJobModal({ open, job, onClose, onSave }) {
  const [form, setForm] = useState({
    name: job.name,
    priority: job.priority,
    startDate: job.startDate,
    dueDate: job.dueDate,
    description: job.description,
  });
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  const invalidDates = form.dueDate < form.startDate;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit job"
      description={job.id}
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(form)} disabled={!form.name.trim() || invalidDates}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Job name" value={form.name} onChange={update('name')} required className="sm:col-span-2" />
        <SelectField label="Priority" value={form.priority} onChange={update('priority')} options={PRIORITIES} />
        <div />
        <TextField label="Start date" type="date" value={form.startDate} onChange={update('startDate')} />
        <TextField
          label="Due date"
          type="date"
          value={form.dueDate}
          onChange={update('dueDate')}
          error={invalidDates ? 'Due date must be after the start date.' : ''}
        />
        <TextArea label="Description" value={form.description} onChange={update('description')} className="sm:col-span-2" />
      </div>
    </Modal>
  );
}
