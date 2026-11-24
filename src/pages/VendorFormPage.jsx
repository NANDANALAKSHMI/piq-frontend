import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Truck } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import MultiSelect from '../components/common/MultiSelect.jsx';
import { StatusBadge } from '../components/common/Badge.jsx';
import { TextArea, TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useServices from '../hooks/useServices.js';
import useLocations from '../hooks/useLocations.js';
import LocationFields from '../features/vendors/LocationFields.jsx';
import { Chip } from '../components/common/Tabs.jsx';
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

  const editing = Boolean(vendorId);
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  /** Categories are the services from the Services page; the services offered are their sub-services. */
  const categories = useMemo(() => services.filter((s) => s.active || form.serviceIds.includes(s.id)), [services, form.serviceIds]);
  const chosen = useMemo(() => categories.filter((s) => form.serviceIds.includes(s.id)), [categories, form.serviceIds]);

  /** Removing a category also clears the sub-services picked under it. */
  const changeCategories = (serviceIds) =>
    setForm((current) => {
      const allowed = new Set(services.filter((s) => serviceIds.includes(s.id)).flatMap((s) => s.subServices.map((sub) => sub.id)));
      return { ...current, serviceIds, subServiceIds: current.subServiceIds.filter((id) => allowed.has(id)) };
    });

  const toggleSub = (subId) =>
    setForm((current) => ({
      ...current,
      subServiceIds: current.subServiceIds.includes(subId) ? current.subServiceIds.filter((id) => id !== subId) : [...current.subServiceIds, subId],
    }));

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
      <PageHeader
        title={title}
        breadcrumbs={[{ label: 'Vendors', to: '/vendors' }, ...(editing ? [{ label: initial.name, to: `/vendors/${vendorId}` }] : []), { label: editing ? 'Edit' : 'Add vendor' }]}
        subtitle={editing ? 'Update this vendor’s details, services and sub-services.' : 'Supplier details, what they provide, and where they are.'}
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-5.5 xl:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-5.5">
      <Card>
        <CardHeader title="Basic information" />
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
          subtitle="What this vendor supplies. Services come from the Services page — pick as many as apply."
          action={
            <Link to="/services" className="text-[13px] font-semibold text-brand-ink hover:underline">
              Manage on Services page
            </Link>
          }
        />
        <MultiSelect
          label="Services"
          options={categories.map((s) => ({ value: s.id, label: s.name, hint: s.description }))}
          value={form.serviceIds}
          onChange={changeCategories}
          placeholder={servicesLoading ? 'Loading services…' : 'Select services'}
          disabled={servicesLoading}
          emptyText="No services yet — add them on the Services page."
          className="lg:max-w-2xl"
        />
      </Card>

      <Card>
        <CardHeader title="Sub-services" subtitle="The sub-services this vendor offers under each chosen service." />
        {!chosen.length ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-[13px] text-muted">Choose at least one service to see its sub-services.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {chosen.map((category) => {
              const subs = category.subServices.filter((sub) => sub.active || form.subServiceIds.includes(sub.id));
              const picked = subs.filter((sub) => form.subServiceIds.includes(sub.id)).length;
              return (
                <li key={category.id} className="rounded-xl border border-line p-3.5">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <b>{category.name}</b>
                    <span className="text-[12.5px] text-muted">
                      {picked} of {subs.length} selected
                    </span>
                  </div>
                  {subs.length ? (
                    <div className="flex flex-wrap gap-2">
                      {subs.map((sub) => (
                        <Chip key={sub.id} active={form.subServiceIds.includes(sub.id)} onClick={() => toggleSub(sub.id)}>
                          {sub.name}
                        </Chip>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-muted">
                      No sub-services under {category.name} yet.{' '}
                      <Link to="/services" className="font-semibold text-brand-ink hover:underline">
                        Add them
                      </Link>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      </div>
      </div>

      <Card>
        <CardHeader title="Vendor status" />
        <div role="radiogroup" aria-label="Vendor status" className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {VENDOR_STATUSES.map(({ value, help }) => (
            <label
              key={value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
                form.status === value ? 'border-2 border-brand bg-[#fbf8f2]' : 'border-line hover:border-slate-300',
              )}
            >
              <input type="radio" name="vendor-status" value={value} checked={form.status === value} onChange={update('status')} className="mt-0.5 size-4 accent-navy" />
              <span>
                <StatusBadge value={value} />
                <span className="mt-1.5 block text-[12.5px] text-muted">{help}</span>
              </span>
            </label>
          ))}
        </div>
      </Card>

      {/* One Save / Cancel pair, kept in view at the bottom while scrolling the form. */}
      <div className="sticky bottom-0 z-20 mt-auto flex shrink-0 justify-end gap-2.5 rounded-2xl border border-line bg-surface/95 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur">
        <Button to={cancelTo}>Cancel</Button>
        <Button variant="primary" icon={Check} disabled={saving || servicesLoading} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save vendor'}
        </Button>
      </div>
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
