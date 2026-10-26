import { useState } from 'react';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import { Chip } from '../../components/common/Tabs.jsx';
import { SelectField, TextArea, TextField } from '../../components/common/FormFields.jsx';
import { CITIES, SCOPE_SERVICES, SERVICES, SERVICE_SCOPES } from '../../data/constants.js';
import { ENQUIRY_SOURCES } from '../../data/enquiriesData.js';
import { jobCategories } from '../../data/categoriesData.js';
import { workflowTemplates } from '../../data/workflowsData.js';
import { rankUnitsForCity } from '../jobs/jobFormHelpers.js';
import { daysFromToday } from '../../utils/formatters.js';

const EMPTY_ENQUIRY = {
  company: '',
  contactName: '',
  phone: '',
  email: '',
  city: CITIES[0],
  location: '',
  source: ENQUIRY_SOURCES[0],
  services: ['Packing'],
  notes: '',
};

export function NewEnquiryModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_ENQUIRY);
  const [errors, setErrors] = useState({});
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  const toggleService = (service) =>
    setForm((current) => ({
      ...current,
      services: current.services.includes(service) ? current.services.filter((s) => s !== service) : [...current.services, service],
    }));

  const submit = () => {
    const next = {};
    if (!form.company.trim()) next.company = 'Company or person name is required.';
    if (!form.contactName.trim()) next.contactName = 'Contact name is required.';
    if (!form.phone.trim()) next.phone = 'Phone is required.';
    if (!form.services.length) next.services = 'Pick at least one service.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const ordered = SERVICES.filter((s) => form.services.includes(s));
    const scope = SERVICE_SCOPES.find((s) => s !== 'Custom' && SCOPE_SERVICES[s].join() === ordered.join()) ?? 'Custom';
    onSave({ ...form, services: ordered, scope, location: form.location || form.city, assignedTo: null });
    setForm(EMPTY_ENQUIRY);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New enquiry"
      description="Record a lead before it becomes a job."
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Save enquiry
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Company / customer" required value={form.company} onChange={update('company')} error={errors.company} />
        <TextField label="Contact name" required value={form.contactName} onChange={update('contactName')} error={errors.contactName} />
        <TextField label="Phone" required type="tel" value={form.phone} onChange={update('phone')} error={errors.phone} />
        <TextField label="Email" type="email" value={form.email} onChange={update('email')} />
        <SelectField label="City" value={form.city} onChange={update('city')} options={CITIES} />
        <TextField label="Area / address" value={form.location} onChange={update('location')} placeholder="e.g. Whitefield" />
        <SelectField label="Source" value={form.source} onChange={update('source')} options={ENQUIRY_SOURCES} />
        <div className="sm:col-span-2">
          <p className="mb-2 text-xs font-semibold text-muted">
            Services required <span className="text-red-600">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((service) => (
              <Chip key={service} active={form.services.includes(service)} onClick={() => toggleService(service)}>
                {service}
              </Chip>
            ))}
          </div>
          {errors.services && <p className="mt-1.5 text-xs font-medium text-red-700">{errors.services}</p>}
        </div>
        <TextArea label="Project notes" value={form.notes} onChange={update('notes')} className="sm:col-span-2" />
      </div>
    </Modal>
  );
}

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
  const ranked = rankUnitsForCity(enquiry.city);
  const [categoryId, setCategoryId] = useState(jobCategories[0].id);
  const category = jobCategories.find((c) => c.id === categoryId);
  const [templateId, setTemplateId] = useState(category.defaultTemplateId);
  const [unitId, setUnitId] = useState(ranked[0].id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Convert to job"
      description="Client, contact, location, services and notes carry over automatically."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onConvert({ categoryId, templateId, unitId })}>
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
          onChange={(e) => {
            const next = jobCategories.find((c) => c.id === e.target.value);
            setCategoryId(next.id);
            setTemplateId(next.defaultTemplateId);
          }}
          options={jobCategories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <SelectField label="Workflow template" value={templateId} onChange={(e) => setTemplateId(e.target.value)} options={workflowTemplates.map((t) => ({ value: t.id, label: t.name }))} />
        <SelectField
          label="Assigned unit"
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          options={ranked.map((u, i) => ({ value: u.id, label: `${u.name}${u.distance !== null ? ` · ${u.distance} km` : ''}${i === 0 ? ' (nearest)' : ''}` }))}
        />
      </div>
    </Modal>
  );
}
