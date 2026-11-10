import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { jobs as initialJobs } from '../data/jobsData.js';
import { clients as initialClients } from '../data/clientsData.js';
import { enquiries as initialEnquiries } from '../data/enquiriesData.js';
import { vendors as initialVendors } from '../data/vendorsData.js';
import { teamMembers as initialMembers } from '../data/teamData.js';
import { notifications as initialNotifications } from '../data/activityData.js';
import { SCOPE_SERVICES } from '../data/constants.js';
import { nextId } from '../utils/jobs.js';
import { daysFromToday } from '../utils/formatters.js';
import { useAuth } from './AuthContext.jsx';
import { isFirebaseConfigured } from '../lib/firebase.js';
import { ADMIN_EMAILS, describeFirestoreError, memberId, normaliseEmail } from '../lib/memberUtils.js';

const AppDataContext = createContext(null);

let uid = 0;
const localId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(uid += 1)}`;
const NO_MEMBERS = [];

/** Firestore + invitation helpers load on demand, keeping the SDK out of the first page load. */
const loadMembersApi = () => import('../lib/members.js');

/** True when this browser has a saved Google sign-in (Firebase keeps it in localStorage). */
function hasSavedGoogleSession() {
  try {
    return Object.keys(window.localStorage).some((key) => key.startsWith('firebase:authUser:'));
  } catch {
    return false;
  }
}

// Returning Google users: download Firestore while the sign-in is still being restored.
if (isFirebaseConfigured && hasSavedGoogleSession()) loadMembersApi().catch(() => {});

function logEntry(type, text, by) {
  return { id: localId('a'), type, text, by, when: 'Just now' };
}

/**
 * Holds every record the UI can change. Most data is still dummy data, so those actions
 * update local React state and last until the page is reloaded. The exception is team
 * invitations: for a Google-signed-in admin they live in Firestore and are emailed for real.
 */
export function AppDataProvider({ children }) {
  const { user } = useAuth();
  const actorId = user?.id ?? 'u1';

  const [jobs, setJobs] = useState(initialJobs);
  const [clients, setClients] = useState(initialClients);
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [vendors, setVendors] = useState(initialVendors);
  const [localMembers, setLocalMembers] = useState(initialMembers);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [teamSnapshot, setTeamSnapshot] = useState({ key: null, list: NO_MEMBERS, error: null });

  /**
   * Where the team comes from:
   * live — signed in with Google: the real team in Firestore. There is one role, so everyone on
   *        the team can invite people and manage access.
   * demo — demo password login: the dummy team in src/data/teamData.js.
   */
  let teamMode = 'none';
  if (user?.provider === 'google') teamMode = isFirebaseConfigured ? 'live' : 'none';
  else if (user) teamMode = 'demo';
  const realTeam = teamMode === 'live';
  const teamKey = realTeam ? `${teamMode}:${user.email}` : null;

  useEffect(() => {
    if (!teamKey) return undefined;
    let unsubscribe = null;
    let cancelled = false;
    loadMembersApi()
      .then(({ subscribeToMembers }) => {
        if (cancelled) return;
        unsubscribe = subscribeToMembers(
          (list) => setTeamSnapshot({ key: teamKey, list, error: null }),
          (err) =>
            setTeamSnapshot((current) => ({
              key: teamKey,
              list: current.key === teamKey ? current.list : NO_MEMBERS,
              error: describeFirestoreError(err),
            })),
        );
      })
      .catch(() =>
        setTeamSnapshot({ key: teamKey, list: NO_MEMBERS, error: 'Could not load the team. Refresh the page and try again.' }),
      );
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [teamKey]);

  const teamSynced = teamKey !== null && teamSnapshot.key === teamKey;
  const firestoreMembers = teamSynced ? teamSnapshot.list : NO_MEMBERS;
  const teamLoading = teamKey !== null && !teamSynced;
  const teamError = teamSynced ? teamSnapshot.error : null;

  /** Admins come from VITE_ADMIN_EMAILS rather than Firestore, so they're added to the real team here. */
  const adminRows = useMemo(() => {
    if (!realTeam) return NO_MEMBERS;
    return ADMIN_EMAILS.map((email) => {
      const isSelf = user.email === email;
      const record = firestoreMembers.find((m) => m.email === email);
      return {
        id: memberId(email),
        source: 'admin',
        name: isSelf ? user.name : record?.name ?? email,
        email,
        phone: (isSelf ? user.phone : record?.phone) ?? '',
        title: 'Administrator',
        role: 'Admin',
        status: 'Active',
        color: 'bg-brand-ink',
        lastActive: '—',
      };
    });
  }, [realTeam, user, firestoreMembers]);

  /** The team shown on the Team page and in the job pickers: real people when signed in with Google. */
  const members = useMemo(
    () => (realTeam ? [...adminRows, ...firestoreMembers.filter((m) => !ADMIN_EMAILS.includes(m.email))] : localMembers),
    [realTeam, adminRows, firestoreMembers, localMembers],
  );

  /** For name lookups only: the team plus the dummy people still referenced by the dummy jobs. */
  const knownMembers = useMemo(() => {
    if (!realTeam) return localMembers;
    const ids = new Set(members.map((m) => m.id));
    return [...members, ...localMembers.filter((m) => !ids.has(m.id))];
  }, [realTeam, members, localMembers]);

  /* ---------- jobs ---------- */

  const updateJob = useCallback((jobId, updater) => {
    setJobs((list) => list.map((job) => (job.id === jobId ? { ...job, ...updater(job) } : job)));
  }, []);

  const addJob = useCallback(
    (draft) => {
      const createdId = nextId('JOB-', jobs.map((job) => job.id));
      const job = {
        vendorIds: [],
        media: [],
        comments: [],
        keyDecision: null,
        createdFrom: null,
        ...draft,
        id: createdId,
        activity: [logEntry('created', draft.createdFrom ? `Created from enquiry ${draft.createdFrom}` : 'Job created', actorId)],
      };
      setJobs((list) => [job, ...list]);
      return createdId;
    },
    [actorId, jobs],
  );

  const setJobStatus = useCallback(
    (jobId, status) => {
      updateJob(jobId, (job) => ({
        status,
        activity: [logEntry('status', `Status changed to ${status}`, actorId), ...job.activity],
      }));
    },
    [actorId, updateJob],
  );

  const setServiceProgress = useCallback(
    (jobId, serviceName, progress) => {
      updateJob(jobId, (job) => ({
        services: job.services.map((s) => (s.name === serviceName ? { ...s, progress } : s)),
        activity:
          progress >= 100
            ? [logEntry('done', `${serviceName} service marked complete`, actorId), ...job.activity]
            : job.activity,
      }));
    },
    [actorId, updateJob],
  );

  const addComment = useCallback(
    (jobId, text, { isDecision = false } = {}) => {
      const member = members.find((m) => m.id === actorId);
      updateJob(jobId, (job) => ({
        comments: [...job.comments, { id: localId('cm'), authorId: actorId, role: member?.title ?? '', minutesAgo: 0, text }],
        keyDecision: isDecision ? { text, by: member?.name ?? 'You', when: 'Just now' } : job.keyDecision,
        activity: [logEntry('comment', isDecision ? 'Key decision recorded' : 'Comment added', actorId), ...job.activity],
      }));
    },
    [actorId, members, updateJob],
  );

  const addMedia = useCallback(
    (jobId, files) => {
      const items = files.map((file) => ({
        id: localId('m'),
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
        title: file.name,
        uploadedBy: actorId,
        when: 'Just now',
      }));
      updateJob(jobId, (job) => ({
        media: [...items, ...job.media],
        activity: [logEntry('media', `${items.length} file${items.length === 1 ? '' : 's'} uploaded`, actorId), ...job.activity],
      }));
    },
    [actorId, updateJob],
  );

  /* ---------- clients ---------- */

  const addClient = useCallback((draft) => {
    const id = localId('c');
    setClients((list) => [{ ...draft, id, since: daysFromToday(0) }, ...list]);
    return id;
  }, []);

  const addLocation = useCallback((clientId, location) => {
    setClients((list) =>
      list.map((client) =>
        client.id === clientId
          ? { ...client, locations: [...client.locations, { ...location, id: localId('loc'), primary: false }] }
          : client,
      ),
    );
  }, []);

  /* ---------- enquiries ---------- */

  const addEnquiry = useCallback(
    (draft) => {
      const createdId = nextId('ENQ-', enquiries.map((e) => e.id), 3);
      setEnquiries((list) => [{ ...draft, id: createdId, status: 'New', receivedOn: daysFromToday(0), followUps: [] }, ...list]);
      return createdId;
    },
    [enquiries],
  );

  const updateEnquiry = useCallback((enquiryId, patch) => {
    setEnquiries((list) => list.map((e) => (e.id === enquiryId ? { ...e, ...patch } : e)));
  }, []);

  const addFollowUp = useCallback(
    (enquiryId, followUp) => {
      setEnquiries((list) =>
        list.map((e) =>
          e.id === enquiryId
            ? {
                ...e,
                status: e.status === 'New' ? 'Follow-up' : e.status,
                followUps: [{ ...followUp, id: localId('f'), ownerId: actorId, done: false }, ...e.followUps],
              }
            : e,
        ),
      );
    },
    [actorId],
  );

  const toggleFollowUp = useCallback((enquiryId, followUpId) => {
    setEnquiries((list) =>
      list.map((e) =>
        e.id === enquiryId
          ? { ...e, followUps: e.followUps.map((f) => (f.id === followUpId ? { ...f, done: !f.done } : f)) }
          : e,
      ),
    );
  }, []);

  /** Creates (or reuses) the client and a new job from an enquiry — nothing is re-typed. */
  const convertEnquiry = useCallback(
    (enquiry, { categoryId, dueInDays = 14 }) => {
      const existing = clients.find((c) => c.name.toLowerCase() === enquiry.company.toLowerCase());
      let clientId = existing?.id;
      let locationId = existing?.locations[0]?.id;
      if (!existing) {
        locationId = localId('loc');
        clientId = addClient({
          name: enquiry.company,
          industry: 'Industrial manufacturing',
          contactName: enquiry.contactName,
          designation: '',
          phone: enquiry.phone,
          email: enquiry.email,
          gstin: '',
          type: 'One-time project',
          notes: enquiry.notes,
          locations: [{ id: locationId, name: enquiry.location, address: enquiry.location, city: enquiry.city, state: '', pin: '', primary: true }],
        });
      }
      const serviceNames = enquiry.scope === 'Custom' ? enquiry.services : SCOPE_SERVICES[enquiry.scope];
      const jobId = addJob({
        name: `${enquiry.company} — ${enquiry.services.join(' + ')}`,
        clientId,
        locationId,
        categoryId,
        subcategory: '',
        scope: enquiry.scope,
        status: 'Upcoming',
        priority: 'Medium',
        startDate: daysFromToday(2),
        dueDate: daysFromToday(dueInDays),
        teamIds: enquiry.assignedTo ? [enquiry.assignedTo] : [],
        description: enquiry.notes,
        createdFrom: enquiry.id,
        services: serviceNames.map((name) => ({ name, ownerId: enquiry.assignedTo ?? actorId, progress: 0 })),
      });
      updateEnquiry(enquiry.id, { status: 'Converted' });
      return jobId;
    },
    [actorId, addClient, addJob, clients, updateEnquiry],
  );

  /* ---------- vendors, team, notifications ---------- */

  const addVendor = useCallback((draft) => {
    setVendors((list) => [{ ...draft, id: localId('v'), jobsUsed: 0, rating: 0 }, ...list]);
  }, []);

  const updateVendor = useCallback((vendorId, patch) => {
    setVendors((list) => list.map((v) => (v.id === vendorId ? { ...v, ...patch } : v)));
  }, []);

  /** Switches someone's access off/on. For the real team this is saved in Firestore and blocks sign-in. */
  const toggleMemberAccess = useCallback(
    async (id) => {
      const member = members.find((m) => m.id === id);
      if (!member) return { ok: false, error: 'That person is no longer on the team.' };
      if (member.source === 'admin') return { ok: false, error: 'Admins are set in VITE_ADMIN_EMAILS.' };
      if (member.source === 'invite') {
        if (teamMode !== 'live') return { ok: false, error: 'Only admins can change access.' };
        const next = member.status === 'Inactive' ? (member.acceptedAt ? 'Active' : 'Invited') : 'Inactive';
        try {
          const { setMemberStatus } = await loadMembersApi();
          await setMemberStatus(member.email, next);
          return { ok: true, status: next };
        } catch (err) {
          return { ok: false, error: describeFirestoreError(err) };
        }
      }
      const next = member.status === 'Inactive' ? 'Active' : 'Inactive';
      setLocalMembers((list) => list.map((m) => (m.id === id ? { ...m, status: next } : m)));
      return { ok: true, status: next };
    },
    [members, teamMode],
  );

  /**
   * Adds someone to the team. As a Google-signed-in admin this saves the invitation in Firestore
   * and emails it from the Snap Infinity mailbox; in demo mode it only updates local state.
   * Resolves to { ok, emailed, error }.
   */
  const inviteMember = useCallback(
    async (draft) => {
      if (teamMode === 'demo') {
        setLocalMembers((list) => [
          ...list,
          { ...draft, status: 'Active', id: localId('u'), lastActive: '—', color: 'bg-slate-500', phone: draft.phone ?? '' },
        ]);
        return { ok: true, emailed: false };
      }
      if (teamMode !== 'live') return { ok: false, error: 'Only admins can invite people.' };
      const email = normaliseEmail(draft.email);
      if (ADMIN_EMAILS.includes(email)) return { ok: false, error: `${email} is already an admin.` };
      try {
        const { createInvite } = await loadMembersApi();
        await createInvite(draft, user.email);
      } catch (err) {
        return { ok: false, error: err.code === 'already-member' ? err.message : describeFirestoreError(err) };
      }
      try {
        const { sendInviteEmail } = await loadMembersApi();
        await sendInviteEmail(draft);
        return { ok: true, emailed: true };
      } catch (err) {
        return { ok: true, emailed: false, error: err.message };
      }
    },
    [teamMode, user],
  );

  const resendInvite = useCallback(async (member) => {
    try {
      const { sendInviteEmail } = await loadMembersApi();
      await sendInviteEmail(member);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  /** Cancels a pending invitation (e.g. a mistyped email); its link stops working. */
  const removeInvite = useCallback(
    async (member) => {
      if (teamMode !== 'live' || member.source !== 'invite') return { ok: false, error: 'Only admins can cancel invitations.' };
      try {
        const { deleteInvite } = await loadMembersApi();
        await deleteInvite(member.email);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: describeFirestoreError(err) };
      }
    },
    [teamMode],
  );

  const markNotificationRead = useCallback((id) => {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
  }, []);

  const value = useMemo(
    () => ({
      jobs, clients, enquiries, vendors, members, knownMembers, notifications,
      addJob, updateJob, setJobStatus, setServiceProgress, addComment, addMedia,
      addClient, addLocation,
      addEnquiry, updateEnquiry, addFollowUp, toggleFollowUp, convertEnquiry,
      addVendor, updateVendor,
      toggleMemberAccess, inviteMember, resendInvite, removeInvite, teamMode, teamLoading, teamError,
      markNotificationRead, markAllNotificationsRead,
    }),
    [
      jobs, clients, enquiries, vendors, members, knownMembers, notifications,
      addJob, updateJob, setJobStatus, setServiceProgress, addComment, addMedia,
      addClient, addLocation,
      addEnquiry, updateEnquiry, addFollowUp, toggleFollowUp, convertEnquiry,
      addVendor, updateVendor,
      toggleMemberAccess, inviteMember, resendInvite, removeInvite, teamMode, teamLoading, teamError,
      markNotificationRead, markAllNotificationsRead,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider');
  return context;
}
