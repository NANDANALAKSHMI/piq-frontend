import { useState } from 'react';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import { Chip } from '../../components/common/Tabs.jsx';
import { SelectField, TextArea, TextField } from '../../components/common/FormFields.jsx';
import { vendorCategories } from '../../data/vendorsData.js';
import { units } from '../../data/unitsData.js';
import { CITIES } from '../../data/constants.js';
import { daysFromToday } from '../../utils/formatters.js';

export function AddVendorModal({ open, defaultCategoryId, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    contact: '',
    phone: '',
    city: CITIES[0],
    address: '',
    categoryIds: [defaultCategoryId],
    supplies: '',
    leadDays: '3',
    payment: '30 days credit',
    status: 'Approved',
    unitIds: [],
  });
  const [errors, setErrors] = useState({});
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  const toggle = (key, value) =>
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((v) => v !== value) : [...current[key], value],
    }));

  const submit = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Vendor name is required.';
    if (!form.phone.trim()) next.phone = 'Phone is required.';
    if (!form.categoryIds.length) next.categories = 'Choose at least one category.';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({
      ...form,
      name: form.name.trim(),
      supplies: form.supplies.split(',').map((s) => s.trim()).filter(Boolean),
      leadDays: Number(form.leadDays) || 1,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add vendor"
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Save vendor
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Vendor name" required value={form.name} onChange={update('name')} error={errors.name} />
        <TextField label="Contact person" value={form.contact} onChange={update('contact')} />
        <TextField label="Phone" required type="tel" value={form.phone} onChange={update('phone')} error={errors.phone} />
        <SelectField label="City" value={form.city} onChange={update('city')} options={CITIES} />
        <TextField label="Address" value={form.address} onChange={update('address')} className="sm:col-span-2" />
        <div className="sm:col-span-2">
          <p className="mb-2 text-xs font-semibold text-muted">
            Categories <span className="text-red-600">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {vendorCategories.map((c) => (
              <Chip key={c.id} active={form.categoryIds.includes(c.id)} onClick={() => toggle('categoryIds', c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>
          {errors.categories && <p className="mt-1.5 text-xs font-medium text-red-700">{errors.categories}</p>}
        </div>
        <TextField label="Supplies" value={form.supplies} onChange={update('supplies')} hint="Separate with commas" className="sm:col-span-2" />
        <TextField label="Lead time (days)" type="number" min="1" value={form.leadDays} onChange={update('leadDays')} />
        <SelectField label="Payment terms" value={form.payment} onChange={update('payment')} options={['Advance', 'Advance 50%', '15 days credit', '30 days credit', 'Cash']} />
        <SelectField label="Status" value={form.status} onChange={update('status')} options={['Preferred', 'Approved', 'On hold']} />
        <div>
          <p className="mb-2 text-xs font-semibold text-muted">Serves units</p>
          <div className="flex flex-wrap gap-2">
            {units.map((u) => (
              <Chip key={u.id} active={form.unitIds.includes(u.id)} onClick={() => toggle('unitIds', u.id)}>
                {u.city}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function PurchaseOrderModal({ open, vendor, jobs, onClose, onSend }) {
  const [form, setForm] = useState({ item: vendor.supplies[0] ?? '', quantity: '', jobId: jobs[0]?.id ?? '', neededBy: daysFromToday(vendor.leadDays + 1), notes: '' });
  const [error, setError] = useState('');
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Raise purchase order"
      description={`${vendor.name} · ${vendor.city}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!form.quantity.trim()) {
                setError('Enter a quantity.');
                return;
              }
              onSend(form);
            }}
          >
            Send PO
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Item" value={form.item} onChange={update('item')} />
        <TextField label="Quantity" required value={form.quantity} onChange={update('quantity')} error={error} placeholder="e.g. 40 cft" />
        <SelectField label="For job" value={form.jobId} onChange={update('jobId')} options={jobs.map((j) => ({ value: j.id, label: `${j.id} · ${j.name}` }))} />
        <TextField label="Needed by" type="date" value={form.neededBy} onChange={update('neededBy')} />
        <TextArea label="Notes" value={form.notes} onChange={update('notes')} rows={2} className="sm:col-span-2" />
      </div>
    </Modal>
  );
}
