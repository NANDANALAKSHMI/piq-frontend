import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Truck } from 'lucide-react';
import StickyPageHeader from '../components/common/StickyPageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ServicePicker from '../features/projects/ServicePicker.jsx';
import QuickAddServiceModal from '../features/services/QuickAddServiceModal.jsx';
import { StatusBadge } from '../components/common/Badge.jsx';
import { TextArea, TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useServices from '../hooks/useServices.js';
import useLocations from '../hooks/useLocations.js';
import LocationFields from '../features/vendors/LocationFields.jsx';
import { VENDOR_STATUSES } from '../features/vendors/vendorStatus.js';
import { cn } from '../utils/formatters.js';

const EMPTY = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  state: '',
  district: '',
  city: '',
  address: '',
  serviceIds: [],
  subServiceIds: [],
  status: 'Approved',
};

const PHONE = /^[+\d][\d\s-]{7,}$/;
const EMAIL = /^\S+@\S+\.\S+$/;

/** The add / edit form. Mounted once the vendor (when editing) has loaded, so `initial` is final. */
function VendorForm({ initial, vendorId }) {
  const { addVendor, updateVendor } = useAppData();
  const { services, loading: servicesLoading } = useServices();
  const { citiesOf, addCity } = useLocations();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false); // pop-up to add a service without leaving the form

  const editing = Boolean(vendorId);
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  /** Categories are the services from the Services page; the services offered are their sub-services. */
  const categories = useMemo(() => services.filter((s) => s.active || form.serviceIds.includes(s.id)), [services, form.serviceIds]);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Vendor name is required.';
    if (!form.phone.trim()) next.phone = 'Phone number is required.';
    else if (!PHONE.test(form.phone.trim())) next.phone = 'Enter a valid phone number.';
    if (form.email.trim() && !EMAIL.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.state && !form.district) next.district = 'Choose a district, or clear the state.';
    if (form.district && !form.city.trim()) next.city = 'Choose or type a city.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (saving) return;
    if (!validate()) {
      showToast('Please fix the highlighted fields.', { tone: 'info' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const city = form.city.trim();
    // Keep only ids that still exist, in case a service was deleted while the form was open.
    const serviceIds = form.serviceIds.filter((id) => services.some((s) => s.id === id));
    const subIds = new Set(services.filter((s) => serviceIds.includes(s.id)).flatMap((s) => s.subServices.map((sub) => sub.id)));
    const draft = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      state: form.state,
      district: form.district,
      city,
      address: form.address.trim(),
      serviceIds,
      subServiceIds: form.subServiceIds.filter((id) => subIds.has(id)),
      status: form.status,
    };

    setSaving(true);
    try {
      const id = editing ? (await updateVendor(vendorId, draft), vendorId) : await addVendor(draft);
      // Remember a newly typed city so it's in the dropdown next time. Not worth failing the save over.
      if (city && !citiesOf(form.state, form.district).includes(city)) addCity(form.state, form.district, city).catch(() => {});
      showToast(editing ? `${draft.name} updated.` : `${draft.name} added to vendors.`);
      navigate(`/vendors/${id}`);
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      setSaving(false);
    }
  };

  const title = editing ? `Edit ${initial.name}` : 'Add vendor';
  const cancelTo = editing ? `/vendors/${vendorId}` : '/vendors';

  return (
    <div className="flex min-h-full flex-col gap-5.5">
      <StickyPageHeader
        icon={Truck}
        title={title}
        subtitle={editing ? 'Update this vendor’s details, services and sub-services.' : 'Supplier details, what they provide, and where they are.'}
        breadcrumbs={[{ label: 'Vendors', to: '/vendors' }, ...(editing ? [{ label: initial.name, to: `/vendors/${vendorId}` }] : []), { label: editing ? 'Edit' : 'Add vendor' }]}
        badge={editing ? undefined : 'Draft'}
        cancelTo={cancelTo}
        submitLabel="Save vendor"
        submitting={saving}
        disabled={servicesLoading}
        onSubmit={handleSave}
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-5.5 xl:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-5.5">
      <Card>
        <CardHeader title="Basic information" subtitle="Who the vendor is and how to reach them." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Vendor name" required value={form.name} onChange={update('name')} error={errors.name} placeholder="e.g. Sri Balaji Timbers" />
          <TextField label="Contact person" value={form.contactPerson} onChange={update('contactPerson')} placeholder="Full name" />
          <TextField label="Phone number" required type="tel" value={form.phone} onChange={update('phone')} error={errors.phone} placeholder="+91 " />
          <TextField label="Email" type="email" value={form.email} onChange={update('email')} error={errors.email} placeholder="name@company.com" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Location" subtitle="Choose the state, then the district, then the city." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <LocationFields value={form} onChange={(place) => setForm((current) => ({ ...current, ...place }))} citiesOf={citiesOf} errors={errors} />
          <TextArea label="Full address" value={form.address} onChange={update('address')} placeholder="Building, street, area, PIN code" className="sm:col-span-3" />
        </div>
      </Card>

      </div>

      <div className="flex min-w-0 flex-col gap-5.5">
      <Card>
        <CardHeader
          title="Services"
          subtitle="Pick what this vendor supplies — tick a service for all of it, or open it to choose sub-services."
          action={
            <button type="button" onClick={() => setQuickAdd(true)} className="text-[13px] font-semibold text-brand-ink hover:underline">
              + New service
            </button>
          }
        />
        <ServicePicker
          services={categories}
          value={{ serviceIds: form.serviceIds, subServiceIds: form.subServiceIds }}
          onChange={({ serviceIds, subServiceIds }) => setForm((current) => ({ ...current, serviceIds, subServiceIds }))}
          loading={servicesLoading}
          className="lg:max-w-2xl"
        />
      </Card>

      <Card>
        <CardHeader title="Vendor status" subtitle="Controls how this vendor appears in project suggestions." />
        <div role="radiogroup" aria-label="Vendor status" className="grid grid-cols-1 gap-2.5 sm:grid-cols-1">
          {VENDOR_STATUSES.map(({ value, help }) => (
            <label
              key={value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
                form.status === value ? 'border-2 border-brand bg-brand-tint' : 'border-line hover:border-slate-300',
              )}
            >
              <input type="radio" name="vendor-status" value={value} checked={form.status === value} onChange={update('status')} className="mt-0.5 size-4 accent-brand" />
              <span>
                <StatusBadge value={value} />
                <span className="mt-1.5 block text-[12.5px] text-muted">{help}</span>
              </span>
            </label>
          ))}
        </div>
      </Card>

      </div>
      </div>



      {quickAdd && (
        <QuickAddServiceModal
          onClose={() => setQuickAdd(false)}
          onCreated={(id) => {
            setForm((current) => ({ ...current, serviceIds: [...new Set([...current.serviceIds, id])] }));
            setQuickAdd(false);
          }}
        />
      )}
    </div>
  );
}

/** /vendors/new and /vendors/:vendorId/edit */
export default function VendorFormPage() {
  const { vendorId } = useParams();
  const { vendors, vendorsLoading } = useAppData();

  if (!vendorId) return <VendorForm initial={EMPTY} />;
  if (vendorsLoading) return <p className="py-10 text-center text-[13px] text-muted">Loading vendor…</p>;

  const vendor = vendors.find((v) => v.id === vendorId);
  if (!vendor) {
    return (
      <EmptyState
        icon={Truck}
        title="Vendor not found"
        description="This vendor may have been deleted."
        action={<Button to="/vendors" variant="primary">Back to vendors</Button>}
      />
    );
  }
  const { id, createdAt, updatedAt, ...initial } = vendor;
  return <VendorForm key={vendorId} initial={initial} vendorId={vendorId} />;
}
