import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { teamMembers as initialMembers } from '../data/teamData.js';
import { notifications as initialNotifications } from '../data/activityData.js';
import { daysFromToday } from '../utils/formatters.js';
import { useAuth } from './AuthContext.jsx';
import useFirestoreList, { firestoreAction } from '../hooks/useFirestoreList.js';
import useSearchIndexSync from '../hooks/useSearchIndexSync.js';
import { isFirebaseConfigured } from '../lib/firebase.js';
import { ADMIN_EMAILS, describeFirestoreError, memberId, normaliseEmail } from '../lib/memberUtils.js';

const AppDataContext = createContext(null);

let uid = 0;
const localId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(uid += 1)}`;
const NO_MEMBERS = [];
const NO_ENQUIRIES = [];
const NO_CLIENTS = [];

/** Firestore + invitation helpers load on demand, keeping the SDK out of the first page load. */
const loadMembersApi = () => import('../lib/members.js');
const loadEnquiriesApi = () => import('../lib/enquiries.js');
const loadClientsApi = () => import('../lib/clients.js');
const loadVendorsApi = () => import('../lib/vendors.js');
const createVendor = firestoreAction(loadVendorsApi, 'createVendor');
const saveVendor = firestoreAction(loadVendorsApi, 'updateVendor');
const deleteVendor = firestoreAction(loadVendorsApi, 'deleteVendor');
const loadProjectsApi = () => import('../lib/projects.js');
const createProject = firestoreAction(loadProjectsApi, 'createProject');
const saveProject = firestoreAction(loadProjectsApi, 'updateProject');

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

/** One line of a project's activity log. `at` is an ISO time, so it sorts and shows "3 h ago". */
function logEntry(type, text, by, byName) {
  return { id: localId('a'), type, text, by, byName, at: new Date().toISOString() };
}

/**
 * Holds every record the UI can change. The team (invitations), clients, enquiries, vendors and
 * projects live in Firestore and update live for everyone signed in.
 */
export function AppDataProvider({ children }) {
  const { user } = useAuth();
  const actorId = user?.id ?? 'u1';

  const { list: projects, loading: projectsLoading, error: projectsError } = useFirestoreList(loadProjectsApi, 'subscribeToProjects', 'projects');
  const [clientSnapshot, setClientSnapshot] = useState({ key: null, list: NO_CLIENTS, error: null });
  const [enquirySnapshot, setEnquirySnapshot] = useState({ key: null, list: NO_ENQUIRIES, error: null });
  const { list: vendors, loading: vendorsLoading, error: vendorsError } = useFirestoreList(loadVendorsApi, 'subscribeToVendors', 'vendors');
  // Sample team: only used when Firebase isn't set up (nobody signs in with these).
  const localMembers = initialMembers;
  const [notifications, setNotifications] = useState(initialNotifications);
  const [teamSnapshot, setTeamSnapshot] = useState({ key: null, list: NO_MEMBERS, error: null });

  /**
   * Everyone signs in through Firebase (email + password or Google), so a signed-in user ('live')
   * always sees the real team from Firestore. There is one role: everyone can invite and manage access.
   */
  const teamMode = user && isFirebaseConfigured ? 'live' : 'none';
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

  /** Enquiries: a live Firestore subscription for whoever is signed in. */
  useEffect(() => {
    if (!teamKey) return undefined;
    let unsubscribe = null;
    let cancelled = false;
    loadEnquiriesApi()
      .then(({ subscribeToEnquiries }) => {
        if (cancelled) return;
        unsubscribe = subscribeToEnquiries(
          (list) => setEnquirySnapshot({ key: teamKey, list, error: null }),
          (err) =>
            setEnquirySnapshot((current) => ({
              key: teamKey,
              list: current.key === teamKey ? current.list : NO_ENQUIRIES,
              error: describeFirestoreError(err),
            })),
        );
      })
      .catch(() =>
        setEnquirySnapshot({ key: teamKey, list: NO_ENQUIRIES, error: 'Could not load the enquiries. Refresh the page and try again.' }),
      );
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [teamKey]);

  /** Clients: a live Firestore subscription for whoever is signed in. */
  useEffect(() => {
    if (!teamKey) return undefined;
    let unsubscribe = null;
    let cancelled = false;
    loadClientsApi()
      .then(({ subscribeToClients }) => {
        if (cancelled) return;
        unsubscribe = subscribeToClients(
          (list) => setClientSnapshot({ key: teamKey, list, error: null }),
          (err) =>
            setClientSnapshot((current) => ({
              key: teamKey,
              list: current.key === teamKey ? current.list : NO_CLIENTS,
              error: describeFirestoreError(err),
            })),
        );
      })
      .catch(() =>
        setClientSnapshot({ key: teamKey, list: NO_CLIENTS, error: 'Could not load the clients. Refresh the page and try again.' }),
      );
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [teamKey]);

  const clientsSynced = teamKey !== null && clientSnapshot.key === teamKey;
  const clients = clientsSynced ? clientSnapshot.list : NO_CLIENTS;
  const clientsLoading = teamKey !== null && !clientsSynced;
  const clientsError = clientsSynced ? clientSnapshot.error : null;

  const enquiriesSynced = teamKey !== null && enquirySnapshot.key === teamKey;
  const enquiries = enquiriesSynced ? enquirySnapshot.list : NO_ENQUIRIES;
  const enquiriesLoading = teamKey !== null && !enquiriesSynced;
  const enquiriesError = enquiriesSynced ? enquirySnapshot.error : null;

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

  /** The team shown on the Team page and in the project pickers: real people when signed in. */
  const members = useMemo(
    () => (realTeam ? [...adminRows, ...firestoreMembers.filter((m) => !ADMIN_EMAILS.includes(m.email))] : localMembers),
    [realTeam, adminRows, firestoreMembers, localMembers],
  );

  /** For name lookups only: the team plus the sample people (used when Firebase isn't set up). */
  const knownMembers = useMemo(() => {
    if (!realTeam) return localMembers;
    const ids = new Set(members.map((m) => m.id));
    return [...members, ...localMembers.filter((m) => !ids.has(m.id))];
  }, [realTeam, members, localMembers]);

  /** Keeps the Algolia search index in step with these lists (does nothing when Algolia isn't set up). */
  useSearchIndexSync({
    enabled: realTeam,
    projects: { rows: projects, ready: !projectsLoading && !projectsError },
    clients: { rows: clients, ready: clientsSynced && !clientsError },
    enquiries: { rows: enquiries, ready: enquiriesSynced && !enquiriesError },
    vendors: { rows: vendors, ready: !vendorsLoading && !vendorsError },
    members: { rows: members, ready: teamSynced && !teamError },
  });

  /* ---------- projects (Firestore) ---------- */

  const actorName = user?.name ?? 'Someone';
  const entry = useCallback((type, text) => logEntry(type, text, actorId, actorName), [actorId, actorName]);
  const findProject = useCallback(
    (projectId) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) throw new Error('That project no longer exists.');
      return project;
    },
    [projects],
  );

  /** Saves a new project and resolves to its id (PRJ-0001…). Rejects with a readable message. */
  const addProject = useCallback(
    (draft) =>
      createProject(
        {
          vendorIds: [],
          comments: [],
          keyDecision: null,
          createdFrom: null,
          completedOn: null,
          ...draft,
          activity: [entry('created', draft.createdFrom ? `Created from enquiry ${draft.createdFrom}` : 'Project created')],
        },
        projects.map((p) => p.id),
        user?.email ?? '',
      ),
    [entry, projects, user],
  );

  /** Saves edited project details (name, dates, priority, description…). */
  const updateProject = useCallback((projectId, patch) => saveProject(projectId, patch, { entry: entry('edit', 'Project details updated') }), [entry]);

  const setProjectStatus = useCallback(
    (projectId, status) =>
      saveProject(
        projectId,
        { status, completedOn: status === 'Completed' ? daysFromToday(0) : null },
        { entry: entry('status', `Status changed to ${status}`) },
      ),
    [entry],
  );

  const setServiceProgress = useCallback(
    async (projectId, serviceId, progress) => {
      const project = findProject(projectId);
      const service = project.services.find((s) => s.serviceId === serviceId);
      return saveProject(
        projectId,
        { services: project.services.map((s) => (s.serviceId === serviceId ? { ...s, progress } : s)) },
        progress >= 100 ? { entry: entry('done', `${service?.name ?? 'Service'} marked complete`) } : {},
      );
    },
    [entry, findProject],
  );

  const addComment = useCallback(
    (projectId, text, { isDecision = false } = {}) => {
      const member = members.find((m) => m.id === actorId);
      const at = new Date().toISOString();
      return saveProject(
        projectId,
        isDecision ? { keyDecision: { text, by: actorName, at } } : {},
        {
          comment: { id: localId('cm'), authorId: actorId, authorName: actorName, role: member?.title ?? '', text, at },
          entry: entry('comment', isDecision ? 'Key decision recorded' : 'Comment added'),
        },
      );
    },
    [actorId, actorName, entry, members],
  );

  /* ---------- clients ---------- */

  /** Runs a lib/clients.js function and turns Firestore failures into plain-language errors. */
  const callClients = useCallback(
    async (name, ...args) => {
      if (!teamKey) throw new Error('Sign in to manage clients.');
      try {
        const api = await loadClientsApi();
        return await api[name](...args);
      } catch (err) {
        throw new Error(describeFirestoreError(err));
      }
    },
    [teamKey],
  );

  /** Saves a new client and resolves to its id. Rejects with a readable message. */
  const addClient = useCallback(
    (draft) => callClients('createClient', { ...draft, since: daysFromToday(0) }, user?.email ?? ''),
    [callClients, user],
  );

  /** Adds a site to a client (saved to Firestore). Resolves to the new location's id. */
  const addLocation = useCallback(
    async (clientId, location) => {
      const client = clients.find((c) => c.id === clientId);
      if (!client) throw new Error('That client no longer exists.');
      const id = localId('loc');
      await callClients('updateClient', clientId, { locations: [...client.locations, { ...location, id, primary: false }] });
      return id;
    },
    [callClients, clients],
  );

  /* ---------- enquiries (Firestore) ---------- */

  /** Runs a lib/enquiries.js function and turns Firestore failures into plain-language errors. */
  const callEnquiries = useCallback(
    async (name, ...args) => {
      if (!teamKey) throw new Error('Sign in to manage enquiries.');
      try {
        const api = await loadEnquiriesApi();
        return await api[name](...args);
      } catch (err) {
        throw new Error(describeFirestoreError(err));
      }
    },
    [teamKey],
  );

  /** Saves a new enquiry and resolves to its id (ENQ-001…). Rejects with a readable message. */
  const addEnquiry = useCallback(
    (draft) =>
      callEnquiries(
        'createEnquiry',
        { ...draft, status: 'New', receivedOn: daysFromToday(0), followUps: [] },
        enquiries.map((e) => e.id),
        user?.email ?? '',
      ),
    [callEnquiries, enquiries, user],
  );

  const updateEnquiry = useCallback((enquiryId, patch) => callEnquiries('updateEnquiry', enquiryId, patch), [callEnquiries]);

  const addFollowUp = useCallback(
    (enquiryId, followUp) => {
      const enquiry = enquiries.find((e) => e.id === enquiryId);
      if (!enquiry) return Promise.reject(new Error('That enquiry no longer exists.'));
      return updateEnquiry(enquiryId, {
        status: enquiry.status === 'New' ? 'Follow-up' : enquiry.status,
        followUps: [{ ...followUp, id: localId('f'), ownerId: actorId, done: false }, ...enquiry.followUps],
      });
    },
    [actorId, enquiries, updateEnquiry],
  );

  const toggleFollowUp = useCallback(
    (enquiryId, followUpId) => {
      const enquiry = enquiries.find((e) => e.id === enquiryId);
      if (!enquiry) return Promise.reject(new Error('That enquiry no longer exists.'));
      return updateEnquiry(enquiryId, { followUps: enquiry.followUps.map((f) => (f.id === followUpId ? { ...f, done: !f.done } : f)) });
    },
    [enquiries, updateEnquiry],
  );

  /**
   * Creates (or reuses) the client and a new project from an enquiry — nothing is re-typed.
   * `services` is the Services-page list, used to match the enquiry's service names.
   */
  const convertEnquiry = useCallback(
    async (enquiry, { services = [], dueDate = daysFromToday(14) } = {}) => {
      const existing = clients.find((c) => c.name.toLowerCase() === enquiry.company.toLowerCase());
      let clientId = existing?.id;
      let locationId = existing?.locations.find((l) => l.primary)?.id ?? existing?.locations[0]?.id ?? '';
      if (!existing) {
        locationId = localId('loc');
        clientId = await addClient({
          name: enquiry.company,
          industry: '',
          contactName: enquiry.contactName,
          designation: '',
          phone: enquiry.phone,
          email: enquiry.email,
          gstin: '',
          type: 'One-time project',
          notes: enquiry.notes,
          locations: [{ id: locationId, name: enquiry.location || enquiry.city, address: enquiry.location, city: enquiry.city, state: enquiry.state ?? '', district: '', pin: '', primary: true }],
        });
      }
      const owner = enquiry.assignedTo ?? actorId;
      const projectServices = enquiry.services.map((name) => {
        const match = services.find((s) => s.name.toLowerCase() === name.toLowerCase());
        return { serviceId: match?.id ?? `name:${name}`, name: match?.name ?? name, subServiceIds: [], ownerId: owner, progress: 0 };
      });
      const projectId = await addProject({
        name: `${enquiry.company} — ${enquiry.services.join(' + ')}`,
        clientId,
        locationId,
        status: 'Upcoming',
        priority: 'Medium',
        startDate: daysFromToday(2),
        dueDate,
        quantity: '',
        description: enquiry.notes,
        notes: '',
        teamIds: [owner],
        createdFrom: enquiry.id,
        services: projectServices,
      });
      updateEnquiry(enquiry.id, { status: 'Converted' }).catch(() => {});
      return projectId;
    },
    [actorId, addClient, addProject, clients, updateEnquiry],
  );

  /* ---------- vendors, team, notifications ---------- */

  /** Saves a new vendor to Firestore and resolves to its id. Rejects with a readable message. */
  const addVendor = useCallback((draft) => createVendor(draft, user?.email ?? ''), [user]);
  const updateVendor = useCallback((vendorId, patch) => saveVendor(vendorId, patch), []);
  const removeVendor = useCallback((vendorId) => deleteVendor(vendorId), []);

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
      return { ok: false, error: 'This person can’t be changed here.' };
    },
    [members, teamMode],
  );

  /**
   * Adds someone to the team: saves the invitation in Firestore and emails it from the Snap Infinity
   * mailbox. Resolves to { ok, emailed, error }.
   */
  const inviteMember = useCallback(
    async (draft) => {
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
      projects, projectsLoading, projectsError, clients, clientsLoading, clientsError, enquiries, enquiriesLoading, enquiriesError, vendors, vendorsLoading, vendorsError, members, knownMembers, notifications,
      addProject, updateProject, setProjectStatus, setServiceProgress, addComment,
      addClient, addLocation,
      addEnquiry, updateEnquiry, addFollowUp, toggleFollowUp, convertEnquiry,
      addVendor, updateVendor, removeVendor,
      toggleMemberAccess, inviteMember, resendInvite, removeInvite, teamMode, teamLoading, teamError,
      markNotificationRead, markAllNotificationsRead,
    }),
    [
      projects, projectsLoading, projectsError, clients, clientsLoading, clientsError, enquiries, enquiriesLoading, enquiriesError, vendors, vendorsLoading, vendorsError, members, knownMembers, notifications,
      addProject, updateProject, setProjectStatus, setServiceProgress, addComment,
      addClient, addLocation,
      addEnquiry, updateEnquiry, addFollowUp, toggleFollowUp, convertEnquiry,
      addVendor, updateVendor, removeVendor,
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
