/** Downloadable CSV reports on the Reports page. Every report is built from live Firestore data. */
export const savedReports = [
  { id: 'r1', name: 'Project status report', description: 'All projects with progress & status', schedule: 'On demand' },
  { id: 'r2', name: 'Overdue & pending', description: 'Open projects and their due dates', schedule: 'On demand' },
  { id: 'r3', name: 'Client history', description: 'Projects per client', schedule: 'On demand' },
  { id: 'r4', name: 'Vendor usage', description: 'Projects each vendor is linked to', schedule: 'On demand' },
  { id: 'r5', name: 'Enquiry pipeline', description: 'Enquiries by source, city & status', schedule: 'On demand' },
];

/** The last `count` months, oldest first: [{ key: '2026-06', label: 'Jun' }, …]. */
export function lastMonths(count, offset = 0) {
  const months = [];
  const now = new Date();
  for (let i = count - 1 + offset; i >= offset; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-IN', { month: 'short' }) });
  }
  return months;
}
