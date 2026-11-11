import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import { Chip } from '../components/common/Tabs.jsx';
import { SelectField, TextArea, TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useServices from '../hooks/useServices.js';
import { SCOPE_SERVICES, SERVICE_SCOPES } from '../data/constants.js';
import { ENQUIRY_SOURCES } from '../data/enquiriesData.js';
import { STATES, citiesOf } from '../data/locationsData.js';

export default function AddEnquiryPage() {
  const { addEnquiry } = useAppData();
  /** The choices come from the Services page: every service that is switched on there. */
  const { services: allServices, loading: servicesLoading } = useServices();
  const serviceOptions = allServices.filter((service) => service.active).map((service) => service.name);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company: '',
    contactName: '',
    phone: '',
    email: '',
    state: '',
    city: '',
    location: '',
    source: ENQUIRY_SOURCES[0],
    services: [],
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  /** Changing the state clears the city, because the city list depends on it. */
  const changeState = (e) => setForm((current) => ({ ...current, state: e.target.value, city: '' }));
  const toggleService = (service) =>
    setForm((current) => ({
      ...current,
      services: current.services.includes(service) ? current.services.filter((s) => s !== service) : [...current.services, service],
    }));

  const handleSave = async () => {
    if (saving) return;
    const next = {};
    if (!form.company.trim()) next.company = 'Company or person name is required.';
    if (!form.contactName.trim()) next.contactName = 'Contact name is required.';
    if (!/^[+\d][\d\s-]{7,}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.state) next.state = 'Choose a state.';
    if (!form.city) next.city = form.state ? 'Choose a city.' : 'Choose a state first.';
    if (!serviceOptions.some((name) => form.services.includes(name))) next.services = 'Pick at least one service.';
    setErrors(next);
    if (Object.keys(next).length) {
      showToast('Please fix the highlighted fields.', { tone: 'info' });
      return;
    }

    const services = serviceOptions.filter((name) => form.services.includes(name));
    const scope = SERVICE_SCOPES.find((s) => s !== 'Custom' && SCOPE_SERVICES[s].join() === services.join()) ?? 'Custom';
    const area = form.location.trim();
    setSaving(true);
    try {
      const id = await addEnquiry({
        ...form,
        company: form.company.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        notes: form.notes.trim(),
        services,
        scope,
        location: area ? `${area}, ${form.city}` : form.city,
        assignedTo: null,
      });
      showToast(`${id} recorded.`);
      navigate(`/enquiries?selected=${id}`);
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      setSaving(false);
    }
  };

  return (
    <div className="flex max-w-4xl flex-col gap-5.5">
      <PageHeader
        title="New enquiry"
        breadcrumbs={[{ label: 'Enquiries', to: '/enquiries' }, { label: 'New enquiry' }]}
        subtitle="Record a lead before it becomes a job."
        actions={
          <>
            <Button to="/enquiries">Cancel</Button>
            <Button variant="primary" icon={Check} disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save enquiry'}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader title="Customer" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Company / customer" required value={form.company} onChange={update('company')} error={errors.company} placeholder="e.g. Deccan Machine Works" />
          <TextField label="Contact name" required value={form.contactName} onChange={update('contactName')} error={errors.contactName} placeholder="Full name" />
          <TextField label="Phone" required type="tel" value={form.phone} onChange={update('phone')} error={errors.phone} placeholder="+91 " />
          <TextField label="Email" type="email" value={form.email} onChange={update('email')} error={errors.email} placeholder="name@company.com" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Location" subtitle="Choose the state first; the city list follows it." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="State" required value={form.state} onChange={changeState} options={STATES} placeholder="Select state" error={errors.state} />
          <SelectField
            label="City"
            required
            value={form.city}
            onChange={update('city')}
            options={citiesOf(form.state)}
            placeholder={form.state ? 'Select city' : 'Select a state first'}
            disabled={!form.state}
            error={errors.city}
          />
          <TextField label="Area / address" value={form.location} onChange={update('location')} placeholder="e.g. Whitefield" className="sm:col-span-2" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Requirement" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Source" value={form.source} onChange={update('source')} options={ENQUIRY_SOURCES} />
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-semibold text-muted">
              Services required <span className="text-red-600">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {serviceOptions.map((service) => (
                <Chip key={service} active={form.services.includes(service)} onClick={() => toggleService(service)}>
                  {service}
                </Chip>
              ))}
            </div>
            {servicesLoading && <p className="text-[13px] text-muted">Loading services…</p>}
            {!servicesLoading && serviceOptions.length === 0 && (
              <p className="text-[13px] text-muted">
                No active services yet.{' '}
                <Link to="/services" className="font-semibold text-brand-ink hover:underline">
                  Add them on the Services page
                </Link>{' '}
                first.
              </p>
            )}
            {errors.services && <p className="mt-1.5 text-xs font-medium text-red-700">{errors.services}</p>}
          </div>
          <TextArea label="Project notes" value={form.notes} onChange={update('notes')} rows={4} className="sm:col-span-2" />
        </div>
      </Card>

      <div className="flex justify-end gap-2.5">
        <Button to="/enquiries">Cancel</Button>
        <Button variant="primary" icon={Check} disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save enquiry'}
        </Button>
      </div>
    </div>
  );
}
