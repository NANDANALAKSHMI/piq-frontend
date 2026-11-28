import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileQuestion, FolderOpen, MessageSquare, Pencil, RefreshCw, Star, X } from 'lucide-react';
import StickyPageHeader from '../components/common/StickyPageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Tabs from '../components/common/Tabs.jsx';
import { StatusBadge, Tag } from '../components/common/Badge.jsx';
import Avatar from '../components/common/Avatar.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useToast } from '../components/common/Toast.jsx';
import ServiceScopeTable from '../features/projects/ServiceScopeTable.jsx';
import CommentsPanel from '../features/projects/CommentsPanel.jsx';
import ActivityTimeline from '../features/projects/ActivityTimeline.jsx';
import { StatusModal } from '../features/projects/ProjectModals.jsx';
import ProgressModal from '../features/projects/ProgressModal.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import useServices from '../hooks/useServices.js';
import { displayStatus, isOverdue } from '../utils/projects.js';
import { cn, dueLabel, formatDate, timeAgo } from '../utils/formatters.js';

function InfoItem({ label, children }) {
  return (
    <div>
      <dt className="mb-0.5 text-xs text-muted">{label}</dt>
      <dd className="font-medium">{children || '—'}</dd>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { projects, projectsLoading, vendors, setProjectStatus, setServiceProgress, addComment } = useAppData();
  const { services } = useServices();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState(null);
  const [progressId, setProgressId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const commentRef = useRef(null);

  const subServiceNames = useMemo(() => new Map(services.flatMap((s) => s.subServices.map((sub) => [sub.id, sub.name]))), [services]);

  /** Runs a save; toasts `message` on success and the error on failure. Resolves to true/false. */
  const save = async (action, message) => {
    try {
      await action();
      if (message) showToast(message);
      return true;
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      return false;
    }
  };

  if (projectsLoading) return <p className="py-10 text-center text-[13px] text-muted">Loading project…</p>;

  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return (
      <div className="mx-auto max-w-lg pt-10">
        <EmptyState
          icon={FileQuestion}
          title={`Project ${projectId} not found`}
          description="It may have been removed, or the link is wrong."
          action={<Button to="/projects" variant="primary">Back to projects</Button>}
        />
      </div>
    );
  }

  const client = lookups.getClient(project.clientId);
  const team = lookups.membersFor(project.teamIds);
  const location = lookups.getLocation(project.clientId, project.locationId);
  const projectVendors = project.vendorIds.map((id) => vendors.find((v) => v.id === id)).filter(Boolean);
  const closed = project.status === 'Completed' || project.status === 'Cancelled';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'Services' },
    { id: 'activity', label: 'Activity' },
  ];

  const servicesCard = (
    <Card>
      <CardHeader title="Services & tracking" subtitle="Each service Box Theory is responsible for is tracked on its own." />
      <ServiceScopeTable
        services={project.services}
        getMember={lookups.getMember}
        subServiceName={(id) => subServiceNames.get(id)}
        editable={!closed}
        onUpdate={(service) => setProgressId(service.serviceId)}
      />
    </Card>
  );

  return (
    <div className="flex flex-col gap-5.5">
      <StickyPageHeader
        icon={FolderOpen}
        title={project.id}
        breadcrumbs={[{ label: 'Projects', to: '/projects' }, { label: project.id }]}
        titleAddon={
          <>
            <StatusBadge value={displayStatus(project)} />
            <StatusBadge value={project.priority} />
          </>
        }
        subtitle={
          <>
            {project.name}
            {client && (
              <>
                {' · '}
                <Link to={`/clients/${project.clientId}`} className="font-semibold text-brand-ink hover:underline">
                  {client.name}
                </Link>
              </>
            )}
          </>
        }
        actions={
          <>
            <Button size="sm" icon={RefreshCw} onClick={() => setModal('status')}>
              Update status
            </Button>
            <Button size="sm" variant="primary" icon={Pencil} to={`/projects/${project.id}/edit`}>
              Edit project
            </Button>
          </>
        }
      >
        <Tabs tabs={tabs} active={tab} onChange={setTab} label="Project sections" />
      </StickyPageHeader>

      {tab === 'overview' && (
        <div className="flex flex-col gap-5.5">
          {/* One summary card: details | assigned team | vendors, side by side on wide screens. */}
          <Card>
            <CardHeader title="Project summary" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,0.9fr)_minmax(0,1.2fr)] lg:gap-0">
              <section aria-label="Project information" className="min-w-0 lg:pr-6">
                <h3 className="mb-3.5 text-sm font-semibold">Project information</h3>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <InfoItem label="Client">
                    {client && (
                      <Link to={`/clients/${project.clientId}`} className="text-brand-ink hover:underline">
                        {client.name}
                      </Link>
                    )}
                  </InfoItem>
                  <InfoItem label="Location">{location && [location.name, location.city].filter(Boolean).join(', ')}</InfoItem>
                  <InfoItem label="Quantity / volume">{project.quantity}</InfoItem>
                  <InfoItem label="Created from">{project.createdFrom ?? 'Direct entry'}</InfoItem>
                  <InfoItem label="Start date">{formatDate(project.startDate)}</InfoItem>
                  <InfoItem label="Expected completion">
                    {formatDate(project.dueDate)}
                    {!closed && project.dueDate && <span className={cn('block text-xs', isOverdue(project) ? 'text-red-700' : 'text-muted')}>{dueLabel(project.dueDate)}</span>}
                  </InfoItem>
                  <InfoItem label="Completed on">{project.completedOn && formatDate(project.completedOn)}</InfoItem>
                  <InfoItem label="Description">
                    <span className="whitespace-pre-line">{project.description}</span>
                  </InfoItem>
                </dl>
                {project.notes && (
                  <>
                    <p className="mb-1 mt-4 text-xs text-muted">Internal notes</p>
                    <p className="whitespace-pre-line">{project.notes}</p>
                  </>
                )}
                {project.keyDecision && (
                  <div className="mt-4 flex gap-3 rounded-xl border border-brand-line bg-brand-soft p-3.5 text-[13px] text-brand-deep">
                    <Star className="size-4.5 shrink-0" aria-hidden="true" />
                    <p>
                      <b>Key decision (pinned)</b>
                      <br />
                      {project.keyDecision.text} — {project.keyDecision.by}, {timeAgo(project.keyDecision.at)}.
                    </p>
                  </div>
                )}
              </section>

              <section aria-label="Assigned team" className="min-w-0 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:px-6 lg:pt-0">
                <h3 className="mb-3.5 text-sm font-semibold">Assigned team</h3>
                {team.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {team.map((member) => (
                      <li key={member.id} title={member.title} className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-field py-1 pl-1 pr-3">
                        <Avatar name={member.name} color={member.color} size="xs" />
                        <span className="truncate text-[13px] font-medium">{member.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-muted">No one assigned yet.</p>
                )}
              </section>

              <section aria-label="Vendors" className="min-w-0 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <div className="mb-3.5 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Vendors</h3>
                  <Link to="/vendors" className="text-[13px] font-semibold text-brand-ink hover:underline">
                    Vendor list
                  </Link>
                </div>
                {projectVendors.length ? (
                  <ul className="flex flex-col gap-3">
                    {projectVendors.map((vendor) => {
                      // What this vendor supplies on THIS project: its services that the project uses.
                      const supplies = project.services.filter((svc) => vendor.serviceIds.includes(svc.serviceId)).map((svc) => svc.name);
                      return (
                        <li key={vendor.id} className="rounded-xl border border-line bg-field p-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <Link to={`/vendors/${vendor.id}`} className="min-w-0 truncate font-semibold hover:text-brand-ink">
                              {vendor.name}
                            </Link>
                            <StatusBadge value={vendor.status} />
                          </div>
                          {supplies.length > 0 && <p className="mt-1.5 text-xs text-muted">For this project: {supplies.join(', ')}</p>}
                          <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                            <div className="min-w-0">
                              <dt className="text-xs text-muted">Contact</dt>
                              <dd className="truncate font-medium">{vendor.contactPerson || '—'}</dd>
                            </div>
                            <div className="min-w-0">
                              <dt className="text-xs text-muted">Location</dt>
                              <dd className="truncate font-medium">{vendor.city || '—'}</dd>
                            </div>
                            <div className="col-span-2">
                              <dt className="text-xs text-muted">Phone</dt>
                              <dd className="font-medium">
                                {vendor.phone ? (
                                  <a href={`tel:${vendor.phone.replace(/\s/g, '')}`} className="hover:text-brand-ink">
                                    {vendor.phone}
                                  </a>
                                ) : (
                                  '—'
                                )}
                              </dd>
                            </div>
                          </dl>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-[13px] text-muted">No vendors linked to this project.</p>
                )}
              </section>
            </div>
          </Card>

          {servicesCard}

          <Card>
            <CardHeader
              title="Activity history"
              action={
                <button type="button" onClick={() => setTab('activity')} className="text-[13px] font-semibold text-brand-ink hover:underline">
                  View all
                </button>
              }
            />
            <ActivityTimeline items={project.activity} getMember={lookups.getMember} limit={5} />
          </Card>
        </div>
      )}

      {tab === 'services' && servicesCard}
      {tab === 'activity' && (
        <Card>
          <CardHeader title="Activity history" />
          <ActivityTimeline items={project.activity} getMember={lookups.getMember} />
        </Card>
      )}

      {/* Team chat: a floating button bottom-right opens the thread. */}
      {chatOpen && (
        <section
          aria-label="Team chat"
          className="fixed bottom-36 right-4 z-40 flex w-[min(24rem,calc(100vw-2rem))] flex-col rounded-2xl border border-line bg-surface p-4 shadow-xl md:bottom-24 md:right-6"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Team chat</h2>
              <p className="text-[13px] text-muted">{project.id} · visible to staff only</p>
            </div>
            <button type="button" onClick={() => setChatOpen(false)} aria-label="Close chat" className="rounded-lg p-1.5 text-muted hover:bg-slate-100">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <CommentsPanel
            className="h-[26rem] max-h-[60vh]"
            comments={project.comments}
            getMember={lookups.getMember}
            textareaRef={commentRef}
            onAdd={(text, options) => save(() => addComment(project.id, text, options), options.isDecision ? 'Key decision pinned to the project.' : 'Message sent.')}
          />
        </section>
      )}
      <button
        type="button"
        onClick={() => setChatOpen((open) => !open)}
        aria-label={chatOpen ? 'Close team chat' : 'Open team chat'}
        aria-expanded={chatOpen}
        className="fixed bottom-20 right-4 z-40 grid size-14 place-items-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-105 md:bottom-6 md:right-6"
      >
        {chatOpen ? <X className="size-6" aria-hidden="true" /> : <MessageSquare className="size-6" aria-hidden="true" />}
      </button>

      {progressId && project.services.some((svc) => svc.serviceId === progressId) && (
        <ProgressModal
          service={project.services.find((svc) => svc.serviceId === progressId)}
          onClose={() => setProgressId(null)}
          onSave={async (percent, note) => {
            const service = project.services.find((svc) => svc.serviceId === progressId);
            const saved = await save(() => setServiceProgress(project.id, progressId, percent, note), `${service.name} updated to ${percent}%.`);
            if (saved) setProgressId(null);
            return saved;
          }}
        />
      )}

      {modal === 'status' && (
        <StatusModal
          project={project}
          onClose={() => setModal(null)}
          onSave={async (status) => {
            const saved = await save(() => setProjectStatus(project.id, status), `${project.id} status set to ${status}.`);
            if (saved) setModal(null);
            return saved;
          }}
        />
      )}
    </div>
  );
}
