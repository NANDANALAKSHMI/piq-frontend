import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, FileQuestion, MessageSquare, Pencil, RefreshCw, Star } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Tabs from '../components/common/Tabs.jsx';
import { StatusBadge } from '../components/common/Badge.jsx';
import Avatar from '../components/common/Avatar.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useToast } from '../components/common/Toast.jsx';
import ServiceScopeTable from '../features/projects/ServiceScopeTable.jsx';
import CommentsPanel from '../features/projects/CommentsPanel.jsx';
import ActivityTimeline from '../features/projects/ActivityTimeline.jsx';
import ProgressRing from '../features/projects/ProgressRing.jsx';
import { EditProjectModal, StatusModal } from '../features/projects/ProjectModals.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import useServices from '../hooks/useServices.js';
import { displayStatus, isOverdue, projectProgress } from '../utils/projects.js';
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
  const { projects, projectsLoading, vendors, setProjectStatus, setServiceProgress, addComment, updateProject } = useAppData();
  const { services } = useServices();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState(null);
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
  const location = lookups.getLocation(project.clientId, project.locationId);
  const progress = projectProgress(project);
  const team = lookups.membersFor(project.teamIds);
  const projectVendors = project.vendorIds.map((id) => vendors.find((v) => v.id === id)).filter(Boolean);
  const closed = project.status === 'Completed' || project.status === 'Cancelled';

  const openComments = () => {
    setTab('comments');
    window.setTimeout(() => commentRef.current?.focus(), 0);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'Services', count: project.services.length },
    { id: 'comments', label: 'Comments', count: project.comments.length },
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
        onProgressChange={(service, value) => save(() => setServiceProgress(project.id, service.serviceId, value), `${service.name} updated to ${value}%.`)}
      />
    </Card>
  );

  const commentsCard = (
    <Card>
      <CardHeader title="Internal comments" subtitle="Visible to staff only" />
      <CommentsPanel
        comments={project.comments}
        getMember={lookups.getMember}
        textareaRef={commentRef}
        onAdd={(text, options) => save(() => addComment(project.id, text, options), options.isDecision ? 'Key decision pinned to the project.' : 'Comment posted.')}
      />
    </Card>
  );

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title={project.id}
        breadcrumbs={[{ label: 'Projects', to: '/projects' }, { label: project.id }]}
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
            <Button icon={RefreshCw} onClick={() => setModal('status')}>
              Update status
            </Button>
            <Button variant="primary" icon={Pencil} onClick={() => setModal('edit')}>
              Edit project
            </Button>
          </>
        }
      >
        <StatusBadge value={displayStatus(project)} />
        <StatusBadge value={project.priority} />
      </PageHeader>

      <Tabs tabs={tabs} active={tab} onChange={setTab} label="Project sections" />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5.5">
            <Card>
              <CardHeader title="Project information" />
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <InfoItem label="Created">{project.createdAt && formatDate(project.createdAt)}</InfoItem>
              </dl>
              <div className="my-4.5 h-px bg-line" />
              <p className="mb-1 text-xs text-muted">Description</p>
              <p className="whitespace-pre-line">{project.description || 'No description added.'}</p>
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
            </Card>
            {servicesCard}
            {commentsCard}
          </div>

          <div className="flex min-w-0 flex-col gap-5.5">
            <Card>
              <CardHeader title="Progress" />
              <div className="flex items-center gap-5">
                <ProgressRing value={progress.percent} label={`${progress.percent}% complete`} />
                <div className="flex flex-col gap-1">
                  <b>
                    {progress.done} of {progress.total} services done
                  </b>
                  {!closed && project.dueDate && (
                    <span className={cn('text-[13px] font-semibold', isOverdue(project) ? 'text-red-700' : 'text-green-700')}>
                      {isOverdue(project) ? 'Behind schedule' : 'On track'} · {dueLabel(project.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Quick actions" />
              <div className="flex flex-col gap-2">
                <Button icon={MessageSquare} onClick={openComments} className="justify-start">
                  Add comment
                </Button>
                <Button
                  icon={CheckCircle2}
                  disabled={closed}
                  className="justify-start"
                  onClick={() => save(() => setProjectStatus(project.id, 'Completed'), `${project.id} marked as completed.`)}
                >
                  Mark completed
                </Button>
                <Button icon={RefreshCw} onClick={() => setModal('status')} className="justify-start">
                  Update status
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader title="Team" />
              {team.length ? (
                <ul className="flex flex-col">
                  {team.map((member) => (
                    <li key={member.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                      <Avatar name={member.name} color={member.color} size="sm" />
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-[12.5px] text-muted">{member.title}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-muted">No one assigned yet.</p>
              )}
            </Card>

            <Card>
              <CardHeader title="Vendors" action={<Link to="/vendors" className="text-[13px] font-semibold text-brand-ink hover:underline">Vendor list</Link>} />
              {projectVendors.length ? (
                <ul className="flex flex-col">
                  {projectVendors.map((vendor) => (
                    <li key={vendor.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
                      <div className="min-w-0">
                        <Link to={`/vendors/${vendor.id}`} className="block truncate font-semibold hover:text-brand-ink">
                          {vendor.name}
                        </Link>
                        <p className="text-[12.5px] text-muted">{services.find((s) => s.id === vendor.serviceIds[0])?.name ?? '—'}</p>
                      </div>
                      <span className="text-[12.5px] text-muted">{vendor.city}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-muted">No vendors linked to this project.</p>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Activity history"
                action={
                  <button type="button" onClick={() => setTab('activity')} className="text-[13px] font-semibold text-brand-ink hover:underline">
                    View all
                  </button>
                }
              />
              <ActivityTimeline items={project.activity} getMember={lookups.getMember} limit={4} />
            </Card>
          </div>
        </div>
      )}

      {tab === 'services' && servicesCard}
      {tab === 'comments' && commentsCard}
      {tab === 'activity' && (
        <Card>
          <CardHeader title="Activity history" />
          <ActivityTimeline items={project.activity} getMember={lookups.getMember} />
        </Card>
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
      {modal === 'edit' && (
        <EditProjectModal
          project={project}
          onClose={() => setModal(null)}
          onSave={async (form) => {
            const saved = await save(() => updateProject(project.id, form), 'Project details saved.');
            if (saved) setModal(null);
            return saved;
          }}
        />
      )}
    </div>
  );
}
