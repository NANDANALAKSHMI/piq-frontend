import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import { CellStack } from '../../components/common/DataTable.jsx';
import { StatusBadge, Tag } from '../../components/common/Badge.jsx';
import { AvatarStack } from '../../components/common/Avatar.jsx';
import ProgressBar from '../../components/common/ProgressBar.jsx';
import { displayStatus, isOverdue, projectProgress } from '../../utils/projects.js';
import { cn, formatDate } from '../../utils/formatters.js';

const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 };

function ProgressCell({ project }) {
  const progress = projectProgress(project);
  const tone = progress.isFinished ? 'green' : project.status === 'On hold' ? 'amber' : 'brand';
  return (
    <div className="flex items-center gap-2.5">
      <ProgressBar value={progress.percent} tone={tone} className="w-16" label={`${progress.percent}% complete`} />
      <span className="text-[13px]">{progress.percent}%</span>
    </div>
  );
}

function ServiceTags({ project }) {
  const names = project.services.map((s) => s.name);
  if (!names.length) return <span className="text-muted">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5" title={names.join(', ')}>
      {names.slice(0, 2).map((name) => (
        <Tag key={name}>{name}</Tag>
      ))}
      {names.length > 2 && <Tag className="bg-brand-soft text-brand-ink">+{names.length - 2}</Tag>}
    </div>
  );
}

/**
 * Column definitions for project tables. Pick columns by key so the dashboard,
 * projects list and client page can share the same cells.
 */
export function buildProjectColumns(lookups, keys) {
  const all = {
    id: {
      key: 'id',
      header: 'Project ID',
      sortable: true,
      render: (project) => (
        <Link to={`/projects/${project.id}`} className="font-semibold text-brand-ink hover:underline">
          {project.id}
        </Link>
      ),
    },
    name: {
      key: 'name',
      header: 'Project & client',
      sortable: true,
      render: (project) => <CellStack primary={project.name} secondary={lookups.getClient(project.clientId)?.name} />,
    },
    projectName: {
      key: 'projectName',
      header: 'Project',
      sortable: true,
      sortValue: (project) => project.name,
      render: (project) => <CellStack primary={project.name} secondary={lookups.projectCity(project)} />,
    },
    city: {
      key: 'city',
      header: 'City',
      sortable: true,
      sortValue: (project) => lookups.projectCity(project),
      render: (project) => lookups.projectCity(project),
    },
    services: {
      key: 'services',
      header: 'Services',
      render: (project) => <ServiceTags project={project} />,
    },
    progress: {
      key: 'progress',
      header: 'Progress',
      sortable: true,
      sortValue: (project) => projectProgress(project).percent,
      render: (project) => <ProgressCell project={project} />,
    },
    team: {
      key: 'team',
      header: 'Team',
      render: (project) => <AvatarStack people={lookups.membersFor(project.teamIds)} />,
    },
    priority: {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      sortValue: (project) => PRIORITY_ORDER[project.priority],
      render: (project) => <StatusBadge value={project.priority} />,
    },
    status: {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (project) => displayStatus(project),
      render: (project) => <StatusBadge value={displayStatus(project)} />,
    },
    due: {
      key: 'due',
      header: 'Due',
      sortable: true,
      sortValue: (project) => project.dueDate,
      render: (project) => <span className={cn(isOverdue(project) && 'font-semibold text-red-700')}>{formatDate(project.dueDate)}</span>,
    },
    view: {
      key: 'view',
      header: <span className="sr-only">Actions</span>,
      render: (project) => (
        <Button size="sm" icon={Eye} to={`/projects/${project.id}`} aria-label={`View ${project.id}`}>
          View
        </Button>
      ),
    },
  };
  return keys.map((key) => all[key]);
}
