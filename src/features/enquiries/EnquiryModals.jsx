import { useState } from 'react';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import { TextField } from '../../components/common/FormFields.jsx';
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

