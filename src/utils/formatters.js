const DAY_MS = 24 * 60 * 60 * 1000;

/** Joins truthy class names. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/** Start of the given date (local time). */
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** ISO date string (YYYY-MM-DD) for today + offset days. Keeps dummy data fresh. */
export function daysFromToday(offset) {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() + offset);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Whole days between today and the given ISO date (negative = past). */
export function daysUntil(isoDate) {
  return Math.round((startOfDay(isoDate) - startOfDay(new Date())) / DAY_MS);
}

export function formatDate(isoDate, { withYear = true } = {}) {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

export function formatToday() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** "2 days left", "Due today", "3 days overdue" */
export function dueLabel(isoDate) {
  const days = daysUntil(isoDate);
  if (days === 0) return 'Due today';
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} left`;
  const late = Math.abs(days);
  return `${late} day${late === 1 ? '' : 's'} overdue`;
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function relativeTime(minutesAgo) {
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  const hours = Math.round(minutesAgo / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}
