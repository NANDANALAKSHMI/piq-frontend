import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, FileQuestion, MapPin, MessageSquare, Pencil, RefreshCw, Star, Upload } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Tabs from '../components/common/Tabs.jsx';
import { StatusBadge, Tag } from '../components/common/Badge.jsx';
import Avatar from '../components/common/Avatar.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useToast } from '../components/common/Toast.jsx';
import WorkflowStepper from '../features/jobs/WorkflowStepper.jsx';
import ServiceScopeTable from '../features/jobs/ServiceScopeTable.jsx';
import MediaGallery from '../features/jobs/MediaGallery.jsx';
import CommentsPanel from '../features/jobs/CommentsPanel.jsx';
import ActivityTimeline from '../features/jobs/ActivityTimeline.jsx';
import ProgressRing from '../features/jobs/ProgressRing.jsx';
import { EditJobModal, StatusModal } from '../features/jobs/JobModals.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import { getTemplate } from '../data/workflowsData.js';
import { vendors as allVendors, getVendorCategory } from '../data/vendorsData.js';
import { displayStatus, isOverdue, stageProgress } from '../utils/jobs.js';
import { cn, dueLabel, formatDate } from '../utils/formatters.js';

function InfoItem({ label, children }) {
  return (
    <div>
      <dt className="mb-0.5 text-xs text-muted">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

export default function JobDetailPage() {
  const { jobId } = useParams();
  const { jobs, vendors, advanceStage, setJobStatus, setServiceProgress, addComment, addMedia, updateJob } = useAppData();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState(null);
  const commentRef = useRef(null);
  const uploadRef = useRef(null);

  const job = jobs.find((j) => j.id === jobId);
  if (!job) {
    return (
      <div className="mx-auto max-w-lg pt-10">
        <EmptyState
          icon={FileQuestion}
          title={`Job ${jobId} not found`}
          description="It may have been removed, or the link is wrong."
          action={<Button to="/jobs" variant="primary">Back to jobs</Button>}
        />
      </div>
    );
  }

  const client = lookups.getClient(job.clientId);
  const location = lookups.getLocation(job.clientId, job.locationId);
  const unit = lookups.getUnit(job.unitId);
  const category = lookups.getCategory(job.categoryId);
  const template = getTemplate(job.templateId);
  const progress = stageProgress(job);
  const team = lookups.membersFor(job.teamIds);
  const jobVendors = job.vendorIds.map((id) => vendors.find((v) => v.id === id) ?? allVendors.find((v) => v.id === id)).filter(Boolean);
  const closed = job.status === 'Completed' || job.status === 'Cancelled';
  const nextStageName = progress.isFinished ? null : progress.stages[progress.done + 1]?.name;

  const handleAdvance = () => {
    advanceStage(job.id);
    showToast(nextStageName ? `${job.id} moved to ${nextStageName}.` : `${job.id} marked as delivered.`);
  };

  const handleUpload = (files) => {
    addMedia(job.id, files);
    showToast(`${files.length} file${files.length === 1 ? '' : 's'} uploaded to ${job.id}.`);
  };

  const openComments = () => {
    setTab('comments');
    window.setTimeout(() => commentRef.current?.focus(), 0);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'workflow', label: 'Workflow' },
    { id: 'services', label: 'Services', count: job.services.length },
    { id: 'media', label: 'Media', count: job.media.length },
    { id: 'comments', label: 'Comments', count: job.comments.length },
    { id: 'activity', label: 'Activity' },
  ];

  const workflowCard = (
    <Card>
      <CardHeader
        title={`Workflow · ${template?.name ?? 'Custom'}`}
        subtitle={template?.allowJobCustomisation ? 'Stages can be adjusted for this job only.' : 'Template stages are fixed for this job.'}
        action={
          !closed && (
            <Button size="sm" variant="primary" iconRight={ArrowRight} onClick={handleAdvance}>
              {nextStageName ? `Move to ${nextStageName}` : 'Mark delivered'}
            </Button>
          )
        }
      />
      <WorkflowStepper stages={progress.stages} current={progress.done} status={job.status} />
    </Card>
  );

  const servicesCard = (
    <Card>
      <CardHeader title="Service scope & tracking" subtitle="Each service PIQ is responsible for is tracked on its own." action={<Tag>{job.scope}</Tag>} />
      <ServiceScopeTable
        services={job.services}
        getMember={lookups.getMember}
        editable={!closed}
        onProgressChange={(name, value) => {
          setServiceProgress(job.id, name, value);
          showToast(`${name} updated to ${value}%.`);
        }}
      />
    </Card>
  );

  const mediaCard = (compact) => (
    <Card>
      <CardHeader
        title="Media gallery"
        subtitle={`${job.media.length} file${job.media.length === 1 ? '' : 's'}`}
        action={compact && job.media.length > 5 ? <button type="button" onClick={() => setTab('media')} className="text-[13px] font-semibold text-brand-ink hover:underline">Open gallery</button> : null}
      />
      <MediaGallery media={job.media} onUpload={handleUpload} getMember={lookups.getMember} compact={compact} />
    </Card>
  );

  const commentsCard = (
    <Card>
      <CardHeader title="Internal comments" subtitle="Visible to staff only" />
      <CommentsPanel
        comments={job.comments}
        getMember={lookups.getMember}
        textareaRef={commentRef}
        onAdd={(text, options) => {
          addComment(job.id, text, options);
          showToast(options.isDecision ? 'Key decision pinned to the job.' : 'Comment posted.');
        }}
      />
    </Card>
  );

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title={job.id}
        breadcrumbs={[{ label: 'Jobs', to: '/jobs' }, { label: job.id }]}
        subtitle={
          <>
            {job.name} ·{' '}
            <Link to={`/clients/${job.clientId}`} className="font-semibold text-brand-ink hover:underline">
              {client?.name}
            </Link>
          </>
        }
        actions={
          <>
            <Button icon={RefreshCw} onClick={() => setModal('status')}>
              Update status
            </Button>
            <Button variant="primary" icon={Pencil} onClick={() => setModal('edit')}>
              Edit job
            </Button>
          </>
        }
      >
        <StatusBadge value={displayStatus(job)} />
        <StatusBadge value={job.priority} />
      </PageHeader>

      <Tabs tabs={tabs} active={tab} onChange={setTab} label="Job sections" />

      {tab === 'overview' && (
        <>
          {workflowCard}
          <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-5.5">
              <Card>
                <CardHeader title="Job information" />
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoItem label="Client">
                    <Link to={`/clients/${job.clientId}`} className="text-brand-ink hover:underline">{client?.name}</Link>
                  </InfoItem>
                  <InfoItem label="Location">{location ? `${location.name}, ${location.city}` : '—'}</InfoItem>
                  <InfoItem label="Category">{category?.name}</InfoItem>
                  <InfoItem label="Subcategory">{job.subcategory || '—'}</InfoItem>
                  <InfoItem label="Start date">{formatDate(job.startDate)}</InfoItem>
                  <InfoItem label="Expected completion">
                    {formatDate(job.dueDate)}
                    {!closed && <span className={cn('block text-xs', isOverdue(job) ? 'text-red-700' : 'text-muted')}>{dueLabel(job.dueDate)}</span>}
                  </InfoItem>
                  <InfoItem label="Assigned unit">
                    <Link to="/units" className="text-brand-ink hover:underline">{unit?.name}</Link>
                  </InfoItem>
                  <InfoItem label="Created from">{job.createdFrom ?? 'Direct entry'}</InfoItem>
                </dl>
                <div className="my-4.5 h-px bg-line" />
                <p className="mb-1 text-xs text-muted">Description</p>
                <p className="whitespace-pre-line">{job.description || 'No description added.'}</p>
                {job.keyDecision && (
                  <div className="mt-4 flex gap-3 rounded-xl border border-brand-line bg-brand-soft p-3.5 text-[13px] text-[#7a2f05]">
                    <Star className="size-4.5 shrink-0" aria-hidden="true" />
                    <p>
                      <b>Key decision (pinned)</b>
                      <br />
                      {job.keyDecision.text} — {job.keyDecision.by}, {job.keyDecision.when}.
                    </p>
                  </div>
                )}
              </Card>
              {servicesCard}
              {mediaCard(true)}
              {commentsCard}
            </div>

            <div className="flex min-w-0 flex-col gap-5.5">
              <Card>
                <CardHeader title="Progress" />
                <div className="flex items-center gap-5">
                  <ProgressRing value={progress.percent} label={`${progress.percent}% complete, ${progress.done} of ${progress.total} stages`} />
                  <div className="flex flex-col gap-1">
                    <b>{progress.done} of {progress.total} stages done</b>
                    <span className="text-[13px] text-muted">Current: {progress.currentName}</span>
                    {!closed && (
                      <span className={cn('text-[13px] font-semibold', isOverdue(job) ? 'text-red-700' : 'text-green-700')}>
                        {isOverdue(job) ? 'Behind schedule' : 'On track'} · {dueLabel(job.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Quick actions" />
                <div className="flex flex-col gap-2">
                  <Button icon={Upload} onClick={() => uploadRef.current?.click()} className="justify-start">Upload media</Button>
                  <input
                    ref={uploadRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length) handleUpload(files);
                      e.target.value = '';
                    }}
                  />
                  <Button icon={MessageSquare} onClick={openComments} className="justify-start">Add comment</Button>
                  <Button icon={ArrowRight} onClick={handleAdvance} disabled={closed} className="justify-start">
                    {nextStageName ? `Move to ${nextStageName}` : 'Mark delivered'}
                  </Button>
                  <Button icon={RefreshCw} onClick={() => setModal('status')} className="justify-start">Update status</Button>
                </div>
              </Card>

              <Card>
                <CardHeader title="Unit & team" action={<Link to="/units" className="text-[13px] font-semibold text-brand-ink hover:underline">Manage</Link>} />
                <div className="mb-3.5 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="grid size-9.5 place-items-center rounded-[10px] bg-brand-soft text-brand-ink">
                    <MapPin className="size-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">{unit?.name}</p>
                    <p className="text-[12.5px] text-muted">{unit?.services.join(', ')}</p>
                  </div>
                </div>
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
                {jobVendors.length ? (
                  <ul className="flex flex-col">
                    {jobVendors.map((vendor) => (
                      <li key={vendor.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{vendor.name}</p>
                          <p className="text-[12.5px] text-muted">{getVendorCategory(vendor.categoryIds[0])?.name}</p>
                        </div>
                        <span className="text-[12.5px] text-muted">{vendor.leadDays} d lead</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-muted">No vendors linked to this job.</p>
                )}
              </Card>

              <Card>
                <CardHeader title="Activity history" action={<button type="button" onClick={() => setTab('activity')} className="text-[13px] font-semibold text-brand-ink hover:underline">View all</button>} />
                <ActivityTimeline items={job.activity} getMember={lookups.getMember} limit={4} />
              </Card>
            </div>
          </div>
        </>
      )}

      {tab === 'workflow' && (
        <>
          {workflowCard}
          <Card>
            <CardHeader title="Stage details" />
            <ol className="flex flex-col gap-2.5">
              {progress.stages.map((stage, index) => (
                <li key={stage.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3.5">
                  <span className="grid size-7 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand-ink">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{stage.name}</p>
                    <p className="text-[12.5px] text-muted">
                      Owner: {stage.ownerRole} · {stage.days} day{stage.days === 1 ? '' : 's'}
                      {stage.photos && ' · photos required'}
                    </p>
                  </div>
                  <StatusBadge value={index < progress.done ? 'Done' : index === progress.done ? (job.status === 'Upcoming' ? 'Upcoming' : 'In progress') : 'Not started'} />
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}
      {tab === 'services' && servicesCard}
      {tab === 'media' && mediaCard(false)}
      {tab === 'comments' && commentsCard}
      {tab === 'activity' && (
        <Card>
          <CardHeader title="Activity history" />
          <ActivityTimeline items={job.activity} getMember={lookups.getMember} />
        </Card>
      )}

      {modal === 'status' && (
        <StatusModal
          open
          job={job}
          onClose={() => setModal(null)}
          onSave={(status) => {
            setJobStatus(job.id, status);
            setModal(null);
            showToast(`${job.id} status set to ${status}.`);
          }}
        />
      )}
      {modal === 'edit' && (
        <EditJobModal
          open
          job={job}
          onClose={() => setModal(null)}
          onSave={(form) => {
            updateJob(job.id, () => form);
            setModal(null);
            showToast('Job details saved.');
          }}
        />
      )}
    </div>
  );
}
