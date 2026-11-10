import { useCallback, useMemo, useState } from 'react';
import { LoaderCircle, SearchX, Send, TriangleAlert, UserPlus, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Toggle from '../components/common/Toggle.jsx';
import Avatar from '../components/common/Avatar.jsx';
import { StatusBadge } from '../components/common/Badge.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Modal from '../components/common/Modal.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { EMAIL_PATTERN } from '../lib/memberUtils.js';
import { formatDate } from '../utils/formatters.js';

const shortDate = (date) => formatDate(date, { withYear: false });

/**
 * `live` = signed in with Google as an admin: the person gets an invitation email and signs in
 * with Google. Otherwise (demo login) the member is only added to the local list.
 */
function AddMemberModal({ live, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', title: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const submit = async () => {
    const email = form.email.trim();
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (live && !email) next.email = 'Email is required.';
    else if (email && !EMAIL_PATTERN.test(email)) next.email = 'Enter a valid email.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setSaving(true);
    const error = await onSave({ ...form, name: form.name.trim(), email, title: form.title.trim() });
    setSaving(false);
    if (error) setFormError(error);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={live ? 'Invite team member' : 'Add team member'}
      description={
        live
          ? 'They get an email invitation and sign in with Google. Everyone you invite gets full access.'
          : 'Team members can be assigned to jobs.'
      }
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" icon={live ? Send : UserPlus} onClick={submit} disabled={saving}>
            {saving ? 'Sending invite…' : live ? 'Send invite' : 'Add member'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Full name" required value={form.name} onChange={update('name')} error={errors.name} />
        <TextField label="Job title" value={form.title} onChange={update('title')} placeholder="e.g. Packing supervisor" />
        <TextField
          label="Email"
          type="email"
          required={live}
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          hint={live ? 'Use the Google account they will sign in with.' : undefined}
        />
        <TextField label="Mobile number" type="tel" value={form.phone} onChange={update('phone')} />
      </div>
      {!live && (
        <p className="mt-4 text-[12.5px] text-muted">Demo mode — sign in with Google as an admin to email real invitations.</p>
      )}
      {formError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-700">
          {formError}
        </p>
      )}
    </Modal>
  );
}

/** Status badge plus invitation details: when the email went out (Resend / Cancel) or when they joined. */
function MemberStatus({ member, canManage, resending, onResend, onCancel }) {
  const fromInvite = member.source === 'invite';
  const pending = fromInvite && member.status === 'Invited';
  return (
    <div className="flex flex-col items-start gap-1">
      <StatusBadge value={member.status} />
      {pending && (
        <div className="flex flex-wrap items-center gap-x-2.5 text-[12px] text-muted">
          <span>{member.lastInviteSentAt ? `Email sent ${shortDate(member.lastInviteSentAt)}` : 'Email not sent yet'}</span>
          {canManage && (
            <>
              <button
                type="button"
                onClick={onResend}
                disabled={resending}
                className="inline-flex items-center gap-1 font-semibold text-brand-ink hover:underline disabled:opacity-50"
              >
                <Send className="size-3" aria-hidden="true" />
                {resending ? 'Sending…' : member.lastInviteSentAt ? 'Resend' : 'Send'}
              </button>
              <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 font-semibold text-red-700 hover:underline">
                <X className="size-3" aria-hidden="true" />
                Cancel
              </button>
            </>
          )}
        </div>
      )}
      {fromInvite && member.status === 'Active' && member.acceptedAt && (
        <span className="text-[12px] text-muted">Joined {shortDate(member.acceptedAt)}</span>
      )}
    </div>
  );
}

/** Confirmation before a pending invitation is deleted. */
function CancelInviteModal({ member, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    const done = await onConfirm(member);
    if (!done) setBusy(false);
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Cancel invitation?"
      description={`${member.name} (${member.email}) won’t be able to join with this invitation.`}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Keep invitation
          </Button>
          <Button variant="danger" onClick={confirm} disabled={busy}>
            {busy ? 'Cancelling…' : 'Cancel invitation'}
          </Button>
        </>
      }
    >
      <p className="text-[13px] text-muted">You can invite them again at any time.</p>
    </Modal>
  );
}

export default function TeamPage() {
  const { members, toggleMemberAccess, inviteMember, resendInvite, removeInvite, teamMode, teamLoading, teamError } = useAppData();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const live = teamMode === 'live';
  const closeAddModal = useCallback(() => setAddOpen(false), []);
  const closeCancelModal = useCallback(() => setCancelling(null), []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) => !q || `${m.name} ${m.email} ${m.title} ${m.phone}`.toLowerCase().includes(q),
    );
  }, [members, query]);

  const nobodyInvited = live && !teamLoading && !teamError && !members.some((m) => m.source === 'invite');

  /** Returns an error message to show in the modal, or null when done. */
  const handleSave = async (draft) => {
    const result = await inviteMember(draft);
    if (!result.ok) return result.error;
    setAddOpen(false);
    if (!live) showToast(`${draft.name} added to the team.`);
    else if (result.emailed) showToast(`Invitation sent to ${draft.email}.`);
    else showToast(`${draft.name} was added, but the email didn't send: ${result.error}`, { tone: 'error' });
    return null;
  };

  const handleResend = async (member) => {
    setResendingId(member.id);
    const result = await resendInvite(member);
    setResendingId(null);
    if (result.ok) showToast(`Invitation sent to ${member.email}.`);
    else showToast(result.error, { tone: 'error' });
  };

  /** Resolves to true when the invitation was cancelled (closes the dialog). */
  const handleCancelInvite = async (member) => {
    const result = await removeInvite(member);
    if (!result.ok) {
      showToast(result.error, { tone: 'error' });
      return false;
    }
    setCancelling(null);
    showToast(`Invitation for ${member.email} cancelled.`);
    return true;
  };

  const handleToggle = async (member) => {
    const result = await toggleMemberAccess(member.id);
    if (!result.ok) showToast(result.error, { tone: 'error' });
    else showToast(result.status === 'Inactive' ? `${member.name} marked inactive.` : `${member.name} is active again.`);
  };

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Team"
        subtitle={live ? 'Everyone who can sign in to Box Theory. Invited people sign in with Google.' : 'The people you assign to jobs.'}
        actions={
          (live || teamMode === 'demo') && (
            <Button variant="primary" icon={UserPlus} onClick={() => setAddOpen(true)}>
              {live ? 'Invite member' : 'Add member'}
            </Button>
          )
        }
      />

      {teamError && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div className="text-[13px]">
            <p className="font-semibold text-amber-900">{live ? 'The team list isn’t connected yet' : 'Couldn’t load the team list'}</p>
            <p className="mt-0.5 text-amber-800">{live ? teamError : 'Please try again in a moment.'}</p>
          </div>
        </div>
      )}

      <Card padded={false}>
        <div className="flex flex-wrap gap-2.5 p-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Search team" className="min-w-52 flex-1 sm:max-w-xs" />
        </div>
        <div className="px-2 pb-4 sm:px-4">
          <DataTable
            rows={rows}
            loading={teamLoading && rows.length === 0}
            minWidth={820}
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
                    <div className="min-w-0">
                      <b>{m.name}</b>
                      {m.email && m.email === user?.email && <span className="ml-1.5 text-[12px] font-medium text-muted">(you)</span>}
                      <p className="text-[12.5px] text-muted">{m.email || '—'}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'title', header: 'Title', sortable: true, render: (m) => m.title || '—' },
              { key: 'phone', header: 'Mobile', render: (m) => m.phone || '—' },
              {
                key: 'status',
                header: 'Status',
                sortable: true,
                render: (m) => (
                  <MemberStatus
                    member={m}
                    canManage={live}
                    resending={resendingId === m.id}
                    onResend={() => handleResend(m)}
                    onCancel={() => setCancelling(m)}
                  />
                ),
              },
              {
                key: 'access',
                header: 'Active',
                render: (m) => (
                  <Toggle
                    checked={m.status !== 'Inactive'}
                    label={`${m.name} active`}
                    disabled={m.source === 'admin' || m.email === user?.email}
                    onChange={() => handleToggle(m)}
                  />
                ),
              },
            ]}
          />
        </div>
        {teamLoading && (
          <p className="flex items-center gap-2 border-t border-line px-4 py-3 text-[13px] text-muted sm:px-6">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Loading invited members…
          </p>
        )}
        {nobodyInvited && (
          <p className="border-t border-line px-4 py-3 text-[13px] text-muted sm:px-6">
            No one has been invited yet. Use <b className="text-ink">Invite member</b> to add your team — they get an email and sign in
            with Google.
          </p>
        )}
      </Card>

      {addOpen && <AddMemberModal live={live} onClose={closeAddModal} onSave={handleSave} />}
      {cancelling && <CancelInviteModal member={cancelling} onClose={closeCancelModal} onConfirm={handleCancelInvite} />}
    </div>
  );
}
