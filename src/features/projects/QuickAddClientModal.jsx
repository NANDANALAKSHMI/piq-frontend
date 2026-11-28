import { useState } from 'react';
import { Check } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { SelectField, TextField } from '../../components/common/FormFields.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';
import { STATES, districtsOf } from '../../data/locationsData.js';

const EMPTY_CLIENT = { name: '', contactName: '', phone: '', email: '' };
const EMPTY_PLACE = { state: '', district: '', city: '', pin: '' };

/**
 * Adds a client without leaving the page you are on (e.g. New project). `onCreated(id)` gets the
 * new client's id so the caller can pick it straight away. More details can be added later on the client's page.
 */
export default function QuickAddClientModal({ onClose, onCreated }) {
  const { addClient } = useAppData();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [place, setPlace] = useState(EMPTY_PLACE);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  const updatePlace = (key) => (e) => setPlace((current) => ({ ...current, [key]: e.target.value }));
  const changeState = (e) => setPlace((current) => ({ ...current, state: e.target.value, district: '' }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Company name is required.';
    if (!form.contactName.trim()) next.contactName = 'Add a contact person.';
    if (!/^[+\d][\d\s-]{7,}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!place.state) next.state = 'Select a state.';
    if (!place.district) next.district = 'Select a district.';
    if (!place.city.trim()) next.city = 'Enter the city.';
    if (!/^\d{6}$/.test(place.pin.trim())) next.pin = 'Enter a 6-digit PIN code.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (saving) return;
    if (!validate()) return;
    setSaving(true);
    try {
      const city = place.city.trim();
      const id = await addClient({
        ...form,
        name: form.name.trim(),
        gstin: '',
        designation: '',
        locations: [
          { id: `loc-${Date.now()}`, name: city, address: '', state: place.state, district: place.district, city, pin: place.pin.trim(), primary: true },
        ],
      });
      showToast(`${form.name.trim()} added.`);
      onCreated(id);
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={saving ? () => {} : onClose}
      size="lg"
      title="New client"
      description="The basics now — you can add more details later on the client’s page."
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" icon={Check} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save client'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Company name" required autoFocus value={form.name} onChange={update('name')} error={errors.name} placeholder="e.g. Deccan Machine Works" className="sm:col-span-2" />
        <TextField label="Contact person" required value={form.contactName} onChange={update('contactName')} error={errors.contactName} placeholder="Full name" />
        <TextField label="Phone" required type="tel" value={form.phone} onChange={update('phone')} error={errors.phone} placeholder="+91 " />
        <TextField label="Email" type="email" value={form.email} onChange={update('email')} error={errors.email} placeholder="name@company.com" className="sm:col-span-2" />
        <SelectField label="State" required value={place.state} onChange={changeState} options={STATES} placeholder="Select state" error={errors.state} />
        <SelectField
          label="District"
          required
          value={place.district}
          onChange={updatePlace('district')}
          options={districtsOf(place.state)}
          placeholder={place.state ? 'Select district' : 'Select a state first'}
          disabled={!place.state}
          error={errors.district}
        />
        <TextField label="City" required value={place.city} onChange={updatePlace('city')} error={errors.city} />
        <TextField label="PIN code" required inputMode="numeric" maxLength={6} value={place.pin} onChange={updatePlace('pin')} error={errors.pin} />
      </div>
    </Modal>
  );
}
