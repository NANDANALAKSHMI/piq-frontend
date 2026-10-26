import { useMemo, useState } from 'react';
import { Check, Minus, SearchX, UserPlus } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Tabs from '../components/common/Tabs.jsx';
import Toggle from '../components/common/Toggle.jsx';
import Avatar from '../components/common/Avatar.jsx';
import Badge, { StatusBadge } from '../components/common/Badge.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Modal from '../components/common/Modal.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { SelectControl, SelectField, TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useLookups from '../hooks/useLookups.js';
import { ROLE_PERMISSIONS } from '../data/teamData.js';
import { units } from '../data/unitsData.js';

const ROLES = ['Admin', 'Manager', 'Staff'];

function PermissionCell({ value }) {
  if (value === 'yes')
    return (
      <span className="inline-grid size-6 place-items-center rounded-md bg-green-50 text-green-700" aria-label="Allowed">
        <Check className="size-4" aria-hidden="true" />
      </span>
    );
  if (value === 'no')
    return (
      <span className="inline-grid size-6 place-items-center rounded-md bg-slate-100 text-slate-400" aria-label="Not allowed">
        <Minus className="size-4" aria-hidden="true" />
      </span>
    );
  return <Badge tone="amber" dot={false}>{value}</Badge>;
}

function InviteModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Staff', title: '', unitId: units[0].id });
  const [errors, setErrors] = useState({});
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const submit = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email.';
    setErrors(next);
    if (!Object.keys(next).length) onSave({ ...form, title: form.title || form.role, unitId: form.role === 'Admin' ? null : form.unitId });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite team member"
      description="They’ll get an email to set a password."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Send invite
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Full name" required value={form.name} onChange={update('name')} error={errors.name} />
        <TextField label="Work email" required type="email" value={form.email} onChange={update('email')} error={errors.email} />
        <SelectField label="Role" value={form.role} onChange={update('role')} options={ROLES} />
        <TextField label="Job title" value={form.title} onChange={update('title')} placeholder="e.g. Packing supervisor" />
        {form.role !== 'Admin' && (
          <SelectField label="Unit" value={form.unitId} onChange={update('unitId')} options={units.map((u) => ({ value: u.id, label: u.name }))} className="sm:col-span-2" />
        )}
      </div>
    </Modal>
  );
}

export default function TeamPage() {
  const { members, toggleMemberAccess, inviteMember } = useAppData();
  const { user } = useAuth();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [tab, setTab] = useState('members');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [unit, setUnit] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [security, setSecurity] = useState({ twoStep: true, autoSignOut: true, otpLogin: true, ipAlerts: false });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) =>
        (!q || `${m.name} ${m.email} ${m.title}`.toLowerCase().includes(q)) &&
        (!role || m.role === role) &&
        (!unit || m.unitId === unit),
    );
  }, [members, query, role, unit]);

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Team & Access"
        subtitle="Who can sign in to PIQ, and what each role is allowed to do."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => setInviteOpen(true)}>
            Invite member
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: 'members', label: 'Members', count: members.length },
          { id: 'roles', label: 'Roles & permissions', count: ROLES.length },
          { id: 'security', label: 'Login & security' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'members' && (
        <Card padded={false}>
          <div className="flex flex-wrap gap-2.5 p-4">
            <SearchInput value={query} onChange={setQuery} placeholder="Search members" className="min-w-52 flex-1 sm:max-w-xs" />
            <SelectControl aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role: All" options={ROLES} className="w-auto" />
            <SelectControl aria-label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit: All" options={units.map((u) => ({ value: u.id, label: u.name }))} className="w-auto" />
          </div>
          <div className="px-2 pb-4 sm:px-4">
            <DataTable
              rows={rows}
              minWidth={760}
              pageSize={8}
              emptyState={<EmptyState icon={SearchX} title="No members match" />}
              columns={[
                {
                  key: 'name',
                  header: 'Member',
                  sortable: true,
                  render: (m) => (
                    <div className="flex items-center gap-2.5">
                      <Avatar name={m.name} color={m.color} size="sm" />
                      <div>
                        <b>{m.name}</b>
                        <p className="text-[12.5px] text-muted">{m.status === 'Invited' ? 'Invite pending' : m.email}</p>
                      </div>
                    </div>
                  ),
                },
                { key: 'role', header: 'Role', sortable: true, render: (m) => <StatusBadge value={m.role} dot={false} /> },
                { key: 'title', header: 'Title', sortable: true },
                { key: 'unit', header: 'Unit', sortable: true, sortValue: (m) => lookups.getUnit(m.unitId)?.city ?? 'All', render: (m) => lookups.getUnit(m.unitId)?.name ?? 'All units' },
                { key: 'lastActive', header: 'Last active' },
                {
                  key: 'access',
                  header: 'Access',
                  render: (m) =>
                    m.status === 'Invited' ? (
                      <button type="button" onClick={() => showToast(`Invite re-sent to ${m.email}.`)} className="text-[13px] font-semibold text-brand-ink hover:underline">
                        Resend invite
                      </button>
                    ) : (
                      <Toggle
                        checked={m.status === 'Active'}
                        disabled={m.id === user?.id}
                        label={`Access for ${m.name}`}
                        onChange={() => {
                          toggleMemberAccess(m.id);
                          showToast(m.status === 'Active' ? `${m.name} can no longer sign in.` : `${m.name}’s access restored.`);
                        }}
                      />
                    ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'roles' && (
        <Card>
          <CardHeader title="Role permissions" subtitle="Managers see only their own unit’s jobs. Staff see jobs they’re assigned to." />
          <DataTable
            rows={ROLE_PERMISSIONS}
            rowKey={(r) => r.permission}
            minWidth={520}
            columns={[
              { key: 'permission', header: 'Permission', render: (r) => <span className="font-medium">{r.permission}</span> },
              ...ROLES.map((r) => ({ key: r, header: r, render: (row) => <PermissionCell value={row[r]} /> })),
            ]}
          />
        </Card>
      )}

      {tab === 'security' && (
        <Card>
          <CardHeader title="Login & security" subtitle="Applies to every PIQ account." />
          <ul className="flex flex-col">
            {[
              { key: 'twoStep', title: 'Two-step sign-in', body: 'OTP to registered mobile on every new device.' },
              { key: 'otpLogin', title: 'Allow sign in with OTP', body: 'Staff can sign in with a one-time code instead of a password.' },
              { key: 'autoSignOut', title: 'Auto sign-out', body: 'After 30 minutes idle on shared devices.' },
              { key: 'ipAlerts', title: 'New location alerts', body: 'Email admins when someone signs in from a new city.' },
            ].map((item) => (
              <li key={item.key} className="flex items-center gap-4 border-b border-line py-3.5 first:pt-0 last:border-0 last:pb-0">
                <div className="flex-1">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-[13px] text-muted">{item.body}</p>
                </div>
                <Toggle
                  checked={security[item.key]}
                  label={item.title}
                  onChange={(value) => {
                    setSecurity((s) => ({ ...s, [item.key]: value }));
                    showToast(`${item.title} ${value ? 'turned on' : 'turned off'}.`);
                  }}
                />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {inviteOpen && (
        <InviteModal
          open
          onClose={() => setInviteOpen(false)}
          onSave={(member) => {
            inviteMember(member);
            setInviteOpen(false);
            setTab('members');
            showToast(`Invite sent to ${member.email}.`);
          }}
        />
      )}
    </div>
  );
}
