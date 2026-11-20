import { daysUntil } from './formatters.js';

const ACTIVE_STATUSES = ['In progress', 'On hold'];

export function isOverdue(project) {
  return ACTIVE_STATUSES.includes(project.status) && Boolean(project.dueDate) && daysUntil(project.dueDate) < 0;
}

/** Status shown in lists: real status, or "Overdue" for active projects past due. */
export function displayStatus(project) {
  return isOverdue(project) ? 'Overdue' : project.status;
}

/** Overall project progress, averaged across its services. */
export function projectProgress(project) {
  const services = project.services ?? [];
  const total = services.length;
  const done = services.filter((s) => s.progress >= 100).length;
  const percent =
    project.status === 'Completed'
      ? 100
      : total
        ? Math.round(services.reduce((sum, s) => sum + (s.progress ?? 0), 0) / total)
        : 0;
  return { total, done, percent, isFinished: percent >= 100 };
}

export function serviceStatus(progress) {
  if (progress >= 100) return 'Done';
  if (progress <= 0) return 'Not started';
  return 'In progress';
}

/** "Packing + Delivery" — the services in a project, for lists and exports. */
export const serviceNames = (project) => project.services.map((s) => s.name).join(' + ') || '—';
