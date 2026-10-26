/** Company-wide activity feed shown on the dashboard. */
export const recentActivities = [
  { id: 'act1', type: 'stage', actorId: 'u2', text: 'moved', jobId: 'JOB-0112', detail: 'to Packing', minutesAgo: 12 },
  { id: 'act2', type: 'media', actorId: 'u3', text: 'uploaded 6 photos to', jobId: 'JOB-0110', detail: '', minutesAgo: 48 },
  { id: 'act3', type: 'converted', actorId: 'u1', text: 'converted ENQ-045 into', jobId: 'JOB-0113', detail: '', minutesAgo: 130 },
  { id: 'act4', type: 'comment', actorId: 'u4', text: 'commented on', jobId: 'JOB-0111', detail: '', minutesAgo: 1500 },
  { id: 'act5', type: 'done', actorId: 'u9', text: 'completed', jobId: 'JOB-0108', detail: '', minutesAgo: 2900 },
];

export const notifications = [
  { id: 'n1', type: 'overdue', title: 'JOB-0107 is overdue', body: 'Pharma Cold-Chain Boxes · Hyderabad Unit', minutesAgo: 30, read: false, link: '/jobs/JOB-0107' },
  { id: 'n2', type: 'mention', title: 'Arun Joseph mentioned you', body: 'On JOB-0110 · “Updated drawing v3 uploaded…”', minutesAgo: 40, read: false, link: '/jobs/JOB-0110' },
  { id: 'n3', type: 'enquiry', title: 'Follow-up due today', body: 'ENQ-046 · Call Meera Iyer at 3:00 PM', minutesAgo: 95, read: false, link: '/enquiries' },
  { id: 'n4', type: 'stage', title: 'JOB-0112 moved to Packing', body: 'Rajesh Kumar updated the stage', minutesAgo: 600, read: true, link: '/jobs/JOB-0112' },
];
