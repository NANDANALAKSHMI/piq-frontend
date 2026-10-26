import { Link } from 'react-router-dom';
import { CellStack } from '../../components/common/DataTable.jsx';
import { StatusBadge, Tag } from '../../components/common/Badge.jsx';
import { AvatarStack } from '../../components/common/Avatar.jsx';
import ProgressBar from '../../components/common/ProgressBar.jsx';
import { displayStatus, isOverdue, stageProgress } from '../../utils/jobs.js';
import { cn, formatDate } from '../../utils/formatters.js';

const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 };

function StageCell({ job }) {
  const progress = stageProgress(job);
  const tone = progress.isFinished ? 'green' : job.status === 'On hold' ? 'amber' : 'brand';
  const label = job.status === 'Upcoming' && progress.done === 0 ? 'Not started' : `${progress.currentName} · ${progress.done}/${progress.total}`;
  return (
    <div className="flex items-center gap-2.5">
      <ProgressBar value={progress.percent} tone={tone} className="w-16" label={`${progress.percent}% complete`} />
      <span className="text-[13px]">{label}</span>
    </div>
  );
}

/**
 * Column definitions for job tables. Pick columns by key so the dashboard,
 * jobs list and client profile can share the same cells.
 */
export function buildJobColumns(lookups, keys) {
  const all = {
    id: {
      key: 'id',
      header: 'Job ID',
      sortable: true,
      render: (job) => (
        <Link to={`/jobs/${job.id}`} className="font-semibold text-brand-ink hover:underline">
          {job.id}
        </Link>
      ),
    },
    name: {
      key: 'name',
      header: 'Job & client',
      sortable: true,
      render: (job) => <CellStack primary={job.name} secondary={lookups.getClient(job.clientId)?.name} />,
    },
    jobName: {
      key: 'jobName',
      header: 'Job',
      sortable: true,
      sortValue: (job) => job.name,
      render: (job) => <CellStack primary={job.name} secondary={job.subcategory} />,
    },
    category: {
      key: 'category',
      header: 'Category',
      sortable: true,
      sortValue: (job) => lookups.getCategory(job.categoryId)?.name,
      render: (job) => <CellStack primary={lookups.getCategory(job.categoryId)?.name ?? '—'} secondary={job.subcategory} />,
    },
    unit: {
      key: 'unit',
      header: 'Unit',
      sortable: true,
      sortValue: (job) => lookups.getUnit(job.unitId)?.city,
      render: (job) => <CellStack primary={lookups.getUnit(job.unitId)?.city ?? '—'} secondary={lookups.jobCity(job)} />,
    },
    scope: {
      key: 'scope',
      header: 'Service scope',
      sortable: true,
      render: (job) => <Tag>{job.scope}</Tag>,
    },
    stage: {
      key: 'stage',
      header: 'Workflow stage',
      sortable: true,
      sortValue: (job) => stageProgress(job).percent,
      render: (job) => <StageCell job={job} />,
    },
    team: {
      key: 'team',
      header: 'Team',
      render: (job) => <AvatarStack people={lookups.membersFor(job.teamIds)} />,
    },
    priority: {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      sortValue: (job) => PRIORITY_ORDER[job.priority],
      render: (job) => <StatusBadge value={job.priority} />,
    },
    status: {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (job) => displayStatus(job),
      render: (job) => <StatusBadge value={displayStatus(job)} />,
    },
    due: {
      key: 'due',
      header: 'Due',
      sortable: true,
      sortValue: (job) => job.dueDate,
      render: (job) => (
        <span className={cn(isOverdue(job) && 'font-semibold text-red-700')}>{formatDate(job.dueDate)}</span>
      ),
    },
  };
  return keys.map((key) => all[key]);
}
