import { getTemplate } from '../data/workflowsData.js';
import { daysUntil } from './formatters.js';

const ACTIVE_STATUSES = ['In progress', 'On hold'];

export function isOverdue(job) {
  return ACTIVE_STATUSES.includes(job.status) && daysUntil(job.dueDate) < 0;
}

/** Status shown in lists: real status, or "Overdue" for active jobs past due. */
export function displayStatus(job) {
  return isOverdue(job) ? 'Overdue' : job.status;
}

/** Stage progress for a job based on its workflow template. */
export function stageProgress(job) {
  const stages = job.stages ?? getTemplate(job.templateId)?.stages ?? [];
  const total = stages.length;
  const done = Math.min(job.currentStage, total);
  const isFinished = done >= total;
  return {
    stages,
    total,
    done,
    percent: total ? Math.round((done / total) * 100) : 0,
    currentName: isFinished ? 'Delivered' : stages[done]?.name ?? '—',
    isFinished,
  };
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
