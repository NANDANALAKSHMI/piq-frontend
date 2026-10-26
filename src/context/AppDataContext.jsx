import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { jobs as initialJobs } from '../data/jobsData.js';
import { clients as initialClients } from '../data/clientsData.js';
import { enquiries as initialEnquiries } from '../data/enquiriesData.js';
import { vendors as initialVendors } from '../data/vendorsData.js';
import { teamMembers as initialMembers } from '../data/teamData.js';
import { notifications as initialNotifications } from '../data/activityData.js';
import { getTemplate } from '../data/workflowsData.js';
import { SCOPE_SERVICES } from '../data/constants.js';
import { nextId } from '../utils/jobs.js';
import { daysFromToday } from '../utils/formatters.js';
import { useAuth } from './AuthContext.jsx';

const AppDataContext = createContext(null);

let uid = 0;
const localId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(uid += 1)}`;

function logEntry(type, text, by) {
  return { id: localId('a'), type, text, by, when: 'Just now' };
}

/**
 * Holds every record the UI can change. There is no backend, so all actions
 * update local React state and last until the page is reloaded.
 */
export function AppDataProvider({ children }) {
  const { user } = useAuth();
  const actorId = user?.id ?? 'u1';

  const [jobs, setJobs] = useState(initialJobs);
  const [clients, setClients] = useState(initialClients);
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [vendors, setVendors] = useState(initialVendors);
  const [members, setMembers] = useState(initialMembers);
  const [notifications, setNotifications] = useState(initialNotifications);

  /* ---------- jobs ---------- */

  const updateJob = useCallback((jobId, updater) => {
    setJobs((list) => list.map((job) => (job.id === jobId ? { ...job, ...updater(job) } : job)));
  }, []);

  const addJob = useCallback(
    (draft) => {
      const createdId = nextId('JOB-', jobs.map((job) => job.id));
      const template = getTemplate(draft.templateId);
      const job = {
        vendorIds: [],
        media: [],
        comments: [],
        keyDecision: null,
        createdFrom: null,
        ...draft,
        id: createdId,
        stages: template?.stages ?? [],
        currentStage: 0,
        activity: [logEntry('created', draft.createdFrom ? `Created from enquiry ${draft.createdFrom}` : 'Job created', actorId)],
      };
      setJobs((list) => [job, ...list]);
      return createdId;
    },
    [actorId, jobs],
  );

  const advanceStage = useCallback(
    (jobId) => {
      updateJob(jobId, (job) => {
        const stages = job.stages ?? getTemplate(job.templateId)?.stages ?? [];
        const next = Math.min(job.currentStage + 1, stages.length);
        const finished = next >= stages.length;
        const text = finished ? 'All stages complete — job delivered' : `Stage moved to ${stages[next].name}`;
        return {
          currentStage: next,
          status: finished ? 'Completed' : 'In progress',
          services: finished ? job.services.map((s) => ({ ...s, progress: 100 })) : job.services,
          activity: [logEntry(finished ? 'done' : 'stage', text, actorId), ...job.activity],
        };
      });
    },
    [actorId, updateJob],
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
    (enquiry, { templateId, unitId, categoryId, dueInDays = 14 }) => {
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
        unitId,
        scope: enquiry.scope,
        templateId,
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

  const toggleMemberAccess = useCallback((memberId) => {
    setMembers((list) =>
      list.map((m) => (m.id === memberId ? { ...m, status: m.status === 'Active' ? 'Inactive' : 'Active' } : m)),
    );
  }, []);

  const inviteMember = useCallback((draft) => {
    setMembers((list) => [
      ...list,
      { ...draft, id: localId('u'), status: 'Invited', lastActive: '—', color: 'bg-slate-500', phone: draft.phone ?? '' },
    ]);
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
  }, []);

  const value = useMemo(
    () => ({
      jobs, clients, enquiries, vendors, members, notifications,
      addJob, updateJob, advanceStage, setJobStatus, setServiceProgress, addComment, addMedia,
      addClient, addLocation,
      addEnquiry, updateEnquiry, addFollowUp, toggleFollowUp, convertEnquiry,
      addVendor, updateVendor,
      toggleMemberAccess, inviteMember,
      markNotificationRead, markAllNotificationsRead,
    }),
    [
      jobs, clients, enquiries, vendors, members, notifications,
      addJob, updateJob, advanceStage, setJobStatus, setServiceProgress, addComment, addMedia,
      addClient, addLocation,
      addEnquiry, updateEnquiry, addFollowUp, toggleFollowUp, convertEnquiry,
      addVendor, updateVendor,
      toggleMemberAccess, inviteMember,
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
