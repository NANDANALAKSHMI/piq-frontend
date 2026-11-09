import { useMemo, useState } from 'react';
import { SearchX, UserPlus } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Toggle from '../components/common/Toggle.jsx';
import Avatar from '../components/common/Avatar.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Modal from '../components/common/Modal.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';

function AddMemberModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', title: '' });
  const [errors, setErrors] = useState({});
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const submit = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email.';
    setErrors(next);
    if (!Object.keys(next).length) onSave({ ...form, title: form.title || 'Staff', role: 'Staff', status: 'Active' });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add team member"
      description="Team members can be assigned to jobs."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Add member
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Full name" required value={form.name} onChange={update('name')} error={errors.name} />
        <TextField label="Job title" value={form.title} onChange={update('title')} placeholder="e.g. Packing supervisor" />
        <TextField label="Email" type="email" value={form.email} onChange={update('email')} error={errors.email} />
        <TextField label="Mobile number" type="tel" value={form.phone} onChange={update('phone')} />
      </div>
    </Modal>
  );
}

export default function TeamPage() {
  const { members, toggleMemberAccess, inviteMember } = useAppData();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) => !q || `${m.name} ${m.email} ${m.title} ${m.phone}`.toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Team"
        subtitle="The people you assign to jobs."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => setAddOpen(true)}>
            Add member
          </Button>
        }
      />

      <Card padded={false}>
        <div className="flex flex-wrap gap-2.5 p-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Search team" className="min-w-52 flex-1 sm:max-w-xs" />
        </div>
        <div className="px-2 pb-4 sm:px-4">
          <DataTable
            rows={rows}
            minWidth={600}
            pageSize={10}
            emptyState={<EmptyState icon={SearchX} title="No team members match" />}
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
                      <p className="text-[12.5px] text-muted">{m.email || '—'}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'title', header: 'Title', sortable: true },
              { key: 'phone', header: 'Mobile', render: (m) => m.phone || '—' },
              {
                key: 'status',
                header: 'Active',
                render: (m) => (
                  <Toggle
                    checked={m.status !== 'Inactive'}
                    label={`${m.name} active`}
                    onChange={() => {
                      toggleMemberAccess(m.id);
                      showToast(m.status === 'Inactive' ? `${m.name} is active again.` : `${m.name} marked inactive.`);
                    }}
                  />
                ),
              },
            ]}
          />
        </div>
      </Card>

      {addOpen && (
        <AddMemberModal
          open
          onClose={() => setAddOpen(false)}
          onSave={(member) => {
            inviteMember(member);
            setAddOpen(false);
            showToast(`${member.name} added to the team.`);
          }}
        />
      )}
    </div>
  );
}
