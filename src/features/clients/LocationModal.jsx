import { useState } from 'react';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import { SelectField, TextField } from '../../components/common/FormFields.jsx';
import { CITIES } from '../../data/constants.js';

const EMPTY = { name: '', address: '', city: CITIES[0], state: '', pin: '' };

export default function LocationModal({ open, clientName, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  const nameError = touched && !form.name.trim() ? 'Site name is required.' : '';

  const submit = () => {
    setTouched(true);
    if (!form.name.trim()) return;
    onSave(form);
    setForm(EMPTY);
    setTouched(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add location"
      description={clientName}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Save location
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Site name" required value={form.name} onChange={update('name')} error={nameError} placeholder="e.g. Hosur Plant" className="sm:col-span-2" />
        <TextField label="Address line" value={form.address} onChange={update('address')} className="sm:col-span-2" />
        <SelectField label="City" value={form.city} onChange={update('city')} options={CITIES} />
        <TextField label="State" value={form.state} onChange={update('state')} />
        <TextField label="PIN code" value={form.pin} onChange={update('pin')} inputMode="numeric" />
      </div>
    </Modal>
  );
}
