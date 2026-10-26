/** Jobs completed per month, per unit, oldest first (last 6 months including this one). */
export const monthlyCompletedByUnit = {
  blr: [7, 8, 7, 9, 8, 9],
  kch: [5, 5, 4, 6, 7, 7],
  chn: [4, 5, 5, 5, 6, 6],
  hyd: [2, 3, 3, 4, 5, 6],
};

export const unitPerformance = [
  { unitId: 'blr', onTime: 94, avgDays: 10.2, utilisation: 73 },
  { unitId: 'kch', onTime: 88, avgDays: 11.0, utilisation: 86 },
  { unitId: 'chn', onTime: 87, avgDays: 13.6, utilisation: 67 },
  { unitId: 'hyd', onTime: 81, avgDays: 12.1, utilisation: 40 },
];

export const staffPerformance = [
  { memberId: 'u2', doneThisMonth: 7, onTime: 96 },
  { memberId: 'u3', doneThisMonth: 5, onTime: 90 },
  { memberId: 'u4', doneThisMonth: 4, onTime: 85 },
  { memberId: 'u6', doneThisMonth: 6, onTime: 92 },
  { memberId: 'u5', doneThisMonth: 3, onTime: 78 },
];

export const savedReports = [
  { id: 'r1', name: 'Job status report', description: 'All jobs by stage & status', schedule: 'On demand' },
  { id: 'r2', name: 'Overdue & pending', description: 'Jobs past or near their due date', schedule: 'Daily 9:00 AM' },
  { id: 'r3', name: 'Client history', description: 'Jobs per client', schedule: 'On demand' },
  { id: 'r4', name: 'Vendor usage', description: 'Vendors used by category', schedule: 'Monthly' },
  { id: 'r5', name: 'Enquiry pipeline', description: 'Conversion by source & city', schedule: 'Weekly' },
];

/** Labels for the last `count` months, oldest first, e.g. ["May", "Jun", ...]. */
export function lastMonthLabels(count) {
  const labels = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString('en-IN', { month: 'short' }));
  }
  return labels;
}
