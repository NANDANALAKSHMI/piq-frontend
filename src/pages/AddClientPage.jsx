import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import { Checkbox, SelectField, TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { STATES, districtsOf } from '../data/locationsData.js';

export default function AddClientPage() {
  const { addClient } = useAppData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    gstin: '',
    contactName: '',
    designation: '',
    phone: '',
    email: '',
  });
  const [place, setPlace] = useState({ state: '', district: '', city: '', pin: '', address: '' });
  const [createJobAfter, setCreateJobAfter] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  const updatePlace = (key) => (e) => setPlace((current) => ({ ...current, [key]: e.target.value }));
  // Changing the state clears the district, because each state has its own districts.
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

  const handleSave = async () => {
    if (saving) return;
    if (!validate()) {
      showToast('Please fix the highlighted fields.', { tone: 'info' });
      return;
    }
    setSaving(true);
    try {
      const city = place.city.trim();
      const id = await addClient({
        ...form,
        name: form.name.trim(),
        locations: [
          {
            id: `loc-${Date.now()}`,
            name: city,
            address: place.address.trim(),
            state: place.state,
            district: place.district,
            city,
            pin: place.pin.trim(),
            primary: true,
          },
        ],
      });
      showToast(`${form.name.trim()} added.`);
      navigate(createJobAfter ? `/jobs/new?client=${id}` : `/clients/${id}`);
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Add client"
        breadcrumbs={[{ label: 'Clients', to: '/clients' }, { label: 'Add client' }]}
        actions={<Button to="/clients">Cancel</Button>}
      />

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader title="Company" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TextField label="Company name" required value={form.name} onChange={update('name')} error={errors.name} placeholder="e.g. Deccan Machine Works" />
            <TextField label="GSTIN" value={form.gstin} onChange={update('gstin')} placeholder="15-character GSTIN" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Contact" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TextField label="Contact person" required value={form.contactName} onChange={update('contactName')} error={errors.contactName} placeholder="Full name" />
            <TextField label="Designation" value={form.designation} onChange={update('designation')} placeholder="e.g. Plant manager" />
            <TextField label="Phone" required type="tel" value={form.phone} onChange={update('phone')} error={errors.phone} placeholder="+91 " />
            <TextField label="Email" type="email" value={form.email} onChange={update('email')} error={errors.email} placeholder="name@company.com" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Location" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            <TextField label="Address (optional)" value={place.address} onChange={updatePlace('address')} className="sm:col-span-2 xl:col-span-4" />
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Checkbox label="Create the first job for this client" checked={createJobAfter} onChange={(e) => setCreateJobAfter(e.target.checked)} />
          <Button variant="primary" icon={Check} onClick={handleSave} disabled={saving}>
            Save client
          </Button>
        </div>
      </div>
    </div>
  );
}
