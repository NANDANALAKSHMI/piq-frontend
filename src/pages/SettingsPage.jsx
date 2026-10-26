import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, KeyRound, LogOut, Upload } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Toggle from '../components/common/Toggle.jsx';
import Avatar from '../components/common/Avatar.jsx';
import Modal from '../components/common/Modal.jsx';
import { SelectField, TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { LogoMark } from '../components/layout/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { nextId } from '../utils/jobs.js';
import { cn } from '../utils/formatters.js';

const SECTIONS = [
  { id: 'company', label: 'Company profile' },
  { id: 'numbering', label: 'Job & enquiry numbering' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'account', label: 'My account' },
];

const NOTIFICATION_EVENTS = [
  { id: 'dueSoon', label: 'A job is due in 2 days' },
  { id: 'overdue', label: 'A job becomes overdue' },
  { id: 'stage', label: 'A job moves to a new stage' },
  { id: 'mention', label: 'I’m mentioned in a comment' },
  { id: 'enquiry', label: 'A new enquiry is assigned to me' },
  { id: 'summary', label: 'Daily summary at 9:00 AM' },
];
const CHANNELS = ['In app', 'Email', 'WhatsApp'];

const DEFAULT_NOTIFICATIONS = {
  dueSoon: { 'In app': true, Email: true, WhatsApp: false },
  overdue: { 'In app': true, Email: true, WhatsApp: true },
  stage: { 'In app': true, Email: false, WhatsApp: false },
  mention: { 'In app': true, Email: true, WhatsApp: false },
  enquiry: { 'In app': true, Email: true, WhatsApp: true },
  summary: { 'In app': false, Email: true, WhatsApp: false },
};

function PasswordModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const update = (key) => (e) => setForm((c) => ({ ...c, [key]: e.target.value }));
  const submit = () => {
    if (form.current.length < 6) return setError('Enter your current password.');
    if (form.next.length < 8) return setError('New password must be at least 8 characters.');
    if (form.next !== form.confirm) return setError('Passwords don’t match.');
    return onSave();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change password"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Update password
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <TextField label="Current password" type="password" value={form.current} onChange={update('current')} autoComplete="current-password" />
        <TextField label="New password" type="password" value={form.next} onChange={update('next')} autoComplete="new-password" hint="At least 8 characters" />
        <TextField label="Confirm new password" type="password" value={form.confirm} onChange={update('confirm')} autoComplete="new-password" error={error} />
      </div>
    </Modal>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { jobs, enquiries } = useAppData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [company, setCompany] = useState({
    name: 'PIQ',
    gstin: '',
    address: '',
    phone: '',
    timezone: 'Asia/Kolkata (IST, UTC+5:30)',
    currency: 'INR (₹) · DD MMM YYYY',
  });
  const [prefixes, setPrefixes] = useState({ job: 'JOB-', enquiry: 'ENQ-' });
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('company');

  const updateCompany = (key) => (e) => setCompany((c) => ({ ...c, [key]: e.target.value }));
  const nextJob = nextId(prefixes.job, jobs.map((j) => j.id));
  const nextEnquiry = nextId(prefixes.enquiry, enquiries.map((e) => e.id), 3);

  const goTo = (id) => {
    setActiveSection(id);
    document.getElementById(`settings-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Settings"
        subtitle="Company details, numbering, notifications and your own account."
        actions={
          <Button variant="primary" icon={Check} onClick={() => showToast('Settings saved.')}>
            Save changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5.5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="self-start p-2 lg:sticky lg:top-24">
          <nav aria-label="Settings sections" className="scrollbar-thin flex gap-1 overflow-x-auto lg:flex-col">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => goTo(section.id)}
                className={cn(
                  'whitespace-nowrap rounded-[10px] px-3 py-2.5 text-left text-sm font-medium',
                  activeSection === section.id ? 'bg-brand-soft font-semibold text-ink' : 'text-slate-600 hover:bg-slate-50',
                )}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </Card>

        <div className="flex min-w-0 flex-col gap-5.5">
          <Card id="settings-company" className="scroll-mt-24">
            <CardHeader title="Company profile" />
            <div className="mb-5 flex items-center gap-4">
              <LogoMark size={64} />
              <div className="flex flex-col gap-2">
                <b>Company logo</b>
                <Button size="sm" icon={Upload} onClick={() => showToast('Logo upload will be available once storage is connected.', { tone: 'info' })}>
                  Upload new
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Company name" value={company.name} onChange={updateCompany('name')} />
              <TextField label="GSTIN" value={company.gstin} onChange={updateCompany('gstin')} placeholder="[COMPANY GSTIN]" />
              <TextField label="Head office address" value={company.address} onChange={updateCompany('address')} placeholder="[HEAD OFFICE ADDRESS]" />
              <TextField label="Support phone" type="tel" value={company.phone} onChange={updateCompany('phone')} placeholder="[PHONE]" />
              <SelectField label="Time zone" value={company.timezone} onChange={updateCompany('timezone')} options={['Asia/Kolkata (IST, UTC+5:30)', 'Asia/Dubai (GST, UTC+4)']} />
              <SelectField label="Currency & date format" value={company.currency} onChange={updateCompany('currency')} options={['INR (₹) · DD MMM YYYY', 'USD ($) · MMM DD YYYY']} />
            </div>
          </Card>

          <Card id="settings-numbering" className="scroll-mt-24">
            <CardHeader title="Job & enquiry numbering" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Job ID prefix" value={prefixes.job} onChange={(e) => setPrefixes((p) => ({ ...p, job: e.target.value.toUpperCase() }))} />
              <TextField label="Enquiry prefix" value={prefixes.enquiry} onChange={(e) => setPrefixes((p) => ({ ...p, enquiry: e.target.value.toUpperCase() }))} />
            </div>
            <p className="mt-3 text-[13px] text-muted">
              Next job will be <b className="text-ink">{nextJob}</b> · next enquiry <b className="text-ink">{nextEnquiry}</b>
            </p>
          </Card>

          <Card id="settings-notifications" className="scroll-mt-24">
            <CardHeader title="Notifications" subtitle="For your account" />
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse">
                <thead>
                  <tr>
                    <th scope="col" className="border-b border-line bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold text-muted">
                      Notify me when…
                    </th>
                    {CHANNELS.map((channel) => (
                      <th key={channel} scope="col" className="border-b border-line bg-slate-50 px-3 py-2.5 text-center text-xs font-semibold text-muted">
                        {channel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NOTIFICATION_EVENTS.map((event) => (
                    <tr key={event.id}>
                      <td className="border-b border-line px-3 py-3">{event.label}</td>
                      {CHANNELS.map((channel) => (
                        <td key={channel} className="border-b border-line px-3 py-3 text-center">
                          <div className="inline-flex">
                            <Toggle
                              checked={notifications[event.id][channel]}
                              label={`${event.label} — ${channel}`}
                              onChange={(value) => setNotifications((n) => ({ ...n, [event.id]: { ...n[event.id], [channel]: value } }))}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card id="settings-account" className="scroll-mt-24">
            <CardHeader title="My account" />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar name={user.name} color={user.color} size="lg" />
                <div>
                  <b className="text-base">{user.name}</b>
                  <p className="text-[13px] text-muted">
                    {user.email} · {user.role === 'Admin' ? 'Administrator · All units' : user.title}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button size="sm" icon={KeyRound} onClick={() => setPasswordOpen(true)}>
                  Change password
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={LogOut}
                  onClick={() => {
                    logout();
                    navigate('/login', { replace: true });
                  }}
                >
                  Sign out
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {passwordOpen && (
        <PasswordModal
          open
          onClose={() => setPasswordOpen(false)}
          onSave={() => {
            setPasswordOpen(false);
            showToast('Password updated.');
          }}
        />
      )}
    </div>
  );
}
