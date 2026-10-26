import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MapPin, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Avatar from '../components/common/Avatar.jsx';
import { Checkbox, SelectField, TextArea, TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { INDUSTRIES } from '../data/clientsData.js';
import { CITIES } from '../data/constants.js';
import { rankUnitsForCity } from '../features/jobs/jobFormHelpers.js';
import { cn } from '../utils/formatters.js';

let locationKey = 0;
const newLocation = (primary = false) => ({ key: (locationKey += 1), name: '', address: '', city: CITIES[0], state: '', pin: '', maps: '', primary });

export default function AddClientPage() {
  const { addClient } = useAppData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    industry: INDUSTRIES[0],
    gstin: '',
    type: 'Regular / contract',
    contactName: '',
    designation: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [locations, setLocations] = useState(() => [newLocation(true)]);
  const [createJobAfter, setCreateJobAfter] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  const updateLocation = (key, field, value) =>
    setLocations((list) => list.map((loc) => (loc.key === key ? { ...loc, [field]: value } : loc)));
  const makePrimary = (key) => setLocations((list) => list.map((loc) => ({ ...loc, primary: loc.key === key })));
  const removeLocation = (key) =>
    setLocations((list) => {
      const next = list.filter((loc) => loc.key !== key);
      if (next.length && !next.some((l) => l.primary)) next[0] = { ...next[0], primary: true };
      return next;
    });

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Company name is required.';
    if (!form.contactName.trim()) next.contactName = 'Add a contact person.';
    if (!/^[+\d][\d\s-]{7,}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    locations.forEach((loc) => {
      if (!loc.name.trim()) next[`loc-${loc.key}`] = 'Site name is required.';
    });
    if (!locations.length) next.locations = 'Add at least one location.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      showToast('Please fix the highlighted fields.', { tone: 'info' });
      return;
    }
    const id = addClient({
      ...form,
      name: form.name.trim(),
      locations: locations.map(({ key, maps, ...loc }) => ({ ...loc, id: `loc-${key}-${Date.now()}` })),
    });
    showToast(`${form.name.trim()} added.`);
    navigate(createJobAfter ? `/jobs/new?client=${id}` : `/clients/${id}`);
  };

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Add client"
        breadcrumbs={[{ label: 'Clients', to: '/clients' }, { label: 'Add client' }]}
        subtitle="Company details, contacts and every site you’ll work at for them."
        actions={
          <>
            <Button to="/clients">Cancel</Button>
            <Button variant="primary" icon={Check} onClick={handleSave}>
              Save client
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5.5">
          <Card>
            <CardHeader title="Company details" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Company name" required value={form.name} onChange={update('name')} error={errors.name} placeholder="e.g. Deccan Machine Works" />
              <SelectField label="Industry" value={form.industry} onChange={update('industry')} options={INDUSTRIES} />
              <TextField label="GSTIN" value={form.gstin} onChange={update('gstin')} placeholder="15-character GSTIN" />
              <SelectField label="Client type" value={form.type} onChange={update('type')} options={['Regular / contract', 'One-time project']} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Primary contact" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Contact person" required value={form.contactName} onChange={update('contactName')} error={errors.contactName} placeholder="Full name" />
              <TextField label="Designation" value={form.designation} onChange={update('designation')} placeholder="e.g. Plant manager" />
              <TextField label="Phone" required type="tel" value={form.phone} onChange={update('phone')} error={errors.phone} placeholder="+91 " />
              <TextField label="Email" type="email" value={form.email} onChange={update('email')} error={errors.email} placeholder="name@company.com" />
            </div>
          </Card>

          <Card>
            <CardHeader title="Locations" subtitle="Add every plant, office or warehouse. Jobs are created against a location, and PIQ suggests the nearest unit." />
            <div className="flex flex-col gap-3">
              {locations.map((loc, index) => {
                const nearest = rankUnitsForCity(loc.city)[0];
                return (
                  <div key={loc.key} className={cn('flex flex-col gap-3.5 rounded-xl border p-4', loc.primary ? 'border-brand-line bg-[#fffbf6]' : 'border-line')}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8.5 place-items-center rounded-lg bg-brand-soft text-brand-ink">
                          <MapPin className="size-4" aria-hidden="true" />
                        </span>
                        <b>Location {index + 1}</b>
                        {loc.primary ? (
                          <Badge tone="orange" dot={false}>Primary · billing</Badge>
                        ) : (
                          <button type="button" onClick={() => makePrimary(loc.key)} className="text-[13px] font-semibold text-brand-ink hover:underline">
                            Make primary
                          </button>
                        )}
                      </div>
                      {locations.length > 1 && (
                        <Button size="sm" icon={Trash2} onClick={() => removeLocation(loc.key)}>
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                        <TextField label="Site name" required value={loc.name} onChange={(e) => updateLocation(loc.key, 'name', e.target.value)} error={errors[`loc-${loc.key}`]} placeholder="e.g. Ambattur Plant" className="sm:col-span-3" />
                        <TextField label="Address line" value={loc.address} onChange={(e) => updateLocation(loc.key, 'address', e.target.value)} className="sm:col-span-3" />
                        <SelectField label="City" required value={loc.city} onChange={(e) => updateLocation(loc.key, 'city', e.target.value)} options={CITIES} />
                        <TextField label="State" value={loc.state} onChange={(e) => updateLocation(loc.key, 'state', e.target.value)} />
                        <TextField label="PIN code" inputMode="numeric" value={loc.pin} onChange={(e) => updateLocation(loc.key, 'pin', e.target.value)} />
                        <TextField label="Google Maps link / coordinates" value={loc.maps} onChange={(e) => updateLocation(loc.key, 'maps', e.target.value)} className="sm:col-span-3" placeholder="Paste a Maps link" />
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <div
                          role="img"
                          aria-label={`Map preview for ${loc.city}`}
                          className="relative grid h-40 place-items-center rounded-xl bg-[#e6ebf2] bg-[linear-gradient(#d5dce6_1px,transparent_1px),linear-gradient(90deg,#d5dce6_1px,transparent_1px)] bg-[size:28px_28px]"
                        >
                          <MapPin className="size-9 fill-brand text-navy" aria-hidden="true" />
                          <span className="absolute bottom-2.5 left-2.5 rounded-md bg-white px-2 py-1 text-xs font-medium">{loc.city}</span>
                        </div>
                        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-[13px] text-green-900">
                          <b>Nearest unit: {nearest.name}</b>
                          <br />
                          {nearest.distance !== null && `${nearest.distance} km · `}
                          {nearest.services.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setLocations((list) => [...list, newLocation(false)])}
                className="flex items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-slate-300 py-3.5 text-[13px] font-semibold text-muted hover:border-brand hover:text-brand-ink"
              >
                <Plus className="size-4" aria-hidden="true" /> Add another location
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Notes" />
            <TextArea label="Client notes" value={form.notes} onChange={update('notes')} placeholder="Payment terms, gate-pass rules, preferred working hours…" />
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-5.5 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader title="Summary" />
            <div className="mb-4 flex items-center gap-3.5">
              <Avatar name={form.name || 'New client'} color="bg-teal-700" size="lg" className="rounded-2xl" />
              <div>
                <b className="text-base">{form.name || 'New client'}</b>
                <p className="text-[12.5px] text-muted">{form.industry}</p>
              </div>
            </div>
            <ul className="flex flex-col text-[13px]">
              <li className="border-b border-line py-2.5">
                <b>{locations.length} location{locations.length === 1 ? '' : 's'}</b>
                <p className="text-muted">{locations.map((l) => l.name || 'Unnamed').join(' · ')}</p>
              </li>
              <li className="border-b border-line py-2.5">
                <b>Default units</b>
                <p className="text-muted">{[...new Set(locations.map((l) => rankUnitsForCity(l.city)[0].name))].join(' · ')}</p>
              </li>
              <li className="py-2.5">
                <b>Contact</b>
                <p className="text-muted">{form.contactName || '—'}</p>
              </li>
            </ul>
          </Card>
          <Card>
            <CardHeader title="After saving" />
            <Checkbox label="Create the first job for this client" checked={createJobAfter} onChange={(e) => setCreateJobAfter(e.target.checked)} />
            <Button variant="primary" fullWidth className="mt-4" icon={Check} onClick={handleSave}>
              Save client
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
