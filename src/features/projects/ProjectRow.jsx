import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronDown, Eye, MapPin } from 'lucide-react';
import { AvatarStack } from '../../components/common/Avatar.jsx';
import StatusMenu, { STATUS_META } from './StatusMenu.jsx';
import { projectProgress, serviceNames } from '../../utils/projects.js';
import { cn, daysUntil, formatDate } from '../../utils/formatters.js';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';
const CLOSED = ['Completed', 'Cancelled'];

const PRIORITY_PILL = {
  High: 'border-red-200 bg-red-50 text-red-700',
  Medium: 'border-amber-200 bg-amber-50 text-amber-800',
  Low: 'border-panel-line bg-slate-50 text-slate-600',
};

/** Red when overdue, amber when due within 3 days — only while the project is still open. */
function dueTone(project) {
  if (!project.dueDate || CLOSED.includes(project.status)) return null;
  const days = daysUntil(project.dueDate);
  if (days < 0) return { className: 'text-red-700 font-semibold', note: `${Math.abs(days)}d overdue` };
  if (days <= 3) return { className: 'text-amber-800 font-semibold', note: days === 0 ? 'Due today' : `Due in ${days}d` };
  return null;
}

export function PriorityPill({ priority }) {
  return (
    <span className={cn('inline-flex h-6 items-center rounded-full border px-2.5 text-[11.5px] font-semibold', PRIORITY_PILL[priority] ?? PRIORITY_PILL.Low)}>
      {priority}
    </span>
  );
}

/** One project in the list: name & client, progress, priority, status (changeable), due date, team. */
export function ProjectRow({ project, lookups, saving, onStatusChange }) {
  const navigate = useNavigate();
  const { done, total } = projectProgress(project);
  const percent = total ? Math.round((done / total) * 100) : 0;
  const client = lookups.getClient(project.clientId)?.name;
  const city = lookups.projectCity(project);
  const due = dueTone(project);
  const finished = total > 0 && done === total;

  // The whole row opens the project; its buttons and links keep their own action.
  const open = (event) => {
    if (event.target.closest('a, button, [role="menu"]')) return;
    navigate(`/projects/${project.id}`);
  };

  return (
    <li
      onClick={open}
      className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] last:rounded-b-xl items-center gap-x-4 gap-y-3 px-4 py-3.5 transition-colors hover:bg-row-hover xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.1fr)_7.5rem_6.5rem_7.5rem_4.5rem_2rem]"
    >
      {/* Name, ID and client */}
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <Link to={`/projects/${project.id}`} className={cn('shrink-0 rounded text-[12.5px] font-semibold text-brand-ink hover:underline', FOCUS)}>
            {project.id}
          </Link>
          <PriorityPill priority={project.priority} />
        </div>
        <p className="mt-1 truncate text-[14.5px] font-semibold" title={project.name}>
          {project.name}
        </p>
        <p className="flex min-w-0 items-center gap-1 truncate text-[12.5px] text-muted">
          <span className="truncate">{client ?? '—'}</span>
          {city && city !== '—' && (
            <>
              <MapPin className="ml-1 size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{city}</span>
            </>
          )}
        </p>
      </div>

      {/* Status — top right on phones, its own column on desktop */}
      <div className="justify-self-end xl:order-4 xl:justify-self-start">
        <StatusMenu status={project.status} label={project.id} disabled={saving} onChange={(next) => onStatusChange(project, next)} />
      </div>

      {/* Below xl these share one line; on xl `contents` turns each into its own table column. */}
      <div className="col-span-2 flex flex-wrap items-center gap-x-5 gap-y-2 xl:contents">
      {/* Services */}
      <p className="min-w-0 basis-full truncate text-[13px] text-ink-soft sm:flex-1 sm:basis-auto xl:order-1" title={serviceNames(project)}>
        {serviceNames(project)}
      </p>

      {/* Progress: completed services / total */}
      <div className="flex w-36 items-center gap-2.5 xl:order-2 xl:w-auto">
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${done} of ${total} services completed`}
          className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-slate-100"
        >
          <div className={cn('h-full rounded-full', finished ? 'bg-green-500' : 'bg-gold')} style={{ width: `${percent}%` }} />
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted">
          {total ? `${done}/${total}` : 'No services'}
        </span>
      </div>

      {/* Due date */}
      <div className={cn('flex items-center gap-1.5 text-[13px] xl:order-3', due ? due.className : 'text-ink-soft')}>
        <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
        <span>
          {formatDate(project.dueDate, { withYear: false })}
          {due && <span className="text-[11.5px] font-medium xl:block"><span className="xl:hidden"> · </span>{due.note}</span>}
        </span>
      </div>

      {/* Team */}
      <div className="hidden items-center sm:flex xl:order-5">
        <AvatarStack people={lookups.membersFor(project.teamIds)} />
      </div>
      </div>
      <Link
        to={`/projects/${project.id}`}
        aria-label={`View ${project.id}`}
        title="View project"
        className={cn(
          'hit-44 hidden size-8 place-items-center rounded-lg border border-panel-line text-ink-soft transition-colors hover:border-gold hover:text-gold xl:order-6 xl:grid',
          FOCUS,
        )}
      >
        <Eye className="size-4" aria-hidden="true" />
      </Link>
    </li>
  );
}

/** Collapsible group of projects with one status, e.g. "Ongoing (12)". */
export function ProjectGroup({ status, count, expanded, onToggle, children }) {
  const meta = STATUS_META[status] ?? { label: status, dot: 'bg-red-500' };
  const panelId = `group-${status.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <section className="rounded-xl border border-panel-line bg-panel">
      <h2 className="font-sans">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
          className={cn('flex min-h-11 w-full items-center gap-2.5 rounded-t-xl px-4 py-2 text-left text-sm font-semibold hover:bg-row-hover', !expanded && 'rounded-b-xl', FOCUS, 'focus-visible:-outline-offset-2')}
        >
          <ChevronDown className={cn('size-4 shrink-0 text-muted transition-transform', !expanded && '-rotate-90')} aria-hidden="true" />
          <span className={cn('size-2.5 rounded-full', meta.dot)} aria-hidden="true" />
          {meta.label}
          <span className="font-medium text-muted">({count})</span>
        </button>
      </h2>
      {expanded && (
        <div id={panelId} className="border-t border-panel-line">
          {children}
        </div>
      )}
    </section>
  );
}
