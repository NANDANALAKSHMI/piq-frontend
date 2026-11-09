import { daysUntil } from './formatters.js';

const ACTIVE_STATUSES = ['In progress', 'On hold'];

export function isOverdue(job) {
  return ACTIVE_STATUSES.includes(job.status) && daysUntil(job.dueDate) < 0;
}

/** Status shown in lists: real status, or "Overdue" for active jobs past due. */
export function displayStatus(job) {
  return isOverdue(job) ? 'Overdue' : job.status;
}

/** Overall job progress, averaged across its services. */
export function jobProgress(job) {
  const services = job.services ?? [];
  const total = services.length;
  const done = services.filter((s) => s.progress >= 100).length;
  const percent =
    job.status === 'Completed'
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

/** Next sequential ID like JOB-0114 from a list of existing IDs. */
export function nextId(prefix, existingIds, pad = 4) {
  const max = existingIds.reduce((highest, id) => {
    const value = Number(String(id).replace(/\D/g, ''));
    return Number.isNaN(value) ? highest : Math.max(highest, value);
  }, 0);
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
}
