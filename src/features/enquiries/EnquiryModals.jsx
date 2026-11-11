import { useState } from 'react';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import { SelectField, TextField } from '../../components/common/FormFields.jsx';
import { jobCategories } from '../../data/categoriesData.js';
import { daysFromToday } from '../../utils/formatters.js';

export function FollowUpModal({ open, enquiry, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', date: daysFromToday(1), time: '11:00' });
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const submit = () => {
    if (!form.title.trim()) return;
    const [h, m] = form.time.split(':').map(Number);
    const time = `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    onSave({ title: form.title.trim(), date: form.date, time });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule follow-up"
      description={`${enquiry.id} · ${enquiry.company}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!form.title.trim()}>
            Schedule
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="What needs to happen" required value={form.title} onChange={update('title')} placeholder="e.g. Call to confirm site visit" className="sm:col-span-2" />
        <TextField label="Date" type="date" value={form.date} onChange={update('date')} />
        <TextField label="Time" type="time" value={form.time} onChange={update('time')} />
      </div>
    </Modal>
  );
}

export function ConvertModal({ open, enquiry, onClose, onConvert }) {
  const [categoryId, setCategoryId] = useState(jobCategories[0].id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Convert to job"
      description="Client, contact, location, services and notes carry over automatically."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onConvert({ categoryId })}>
            Create job
          </Button>
        </>
      }
    >
      <div className="mb-4 rounded-xl bg-slate-50 p-3.5 text-[13px]">
        <b>{enquiry.company}</b> · {enquiry.contactName} · {enquiry.location}
        <br />
        <span className="text-muted">Services: {enquiry.services.join(', ')}</span>
      </div>
      <div className="grid gap-4">
        <SelectField
          label="Job category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={jobCategories.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>
    </Modal>
  );
}
