export const JOB_STATUSES = ['Upcoming', 'In progress', 'On hold', 'Completed', 'Cancelled'];

export const PRIORITIES = ['Low', 'Medium', 'High'];

export const SERVICE_SCOPES = [
  'Design only',
  'Packing only',
  'Design + Packing',
  'Complete project',
  'Custom',
];

export const SERVICES = ['Site survey', 'Design', 'Production', 'Packing', 'Delivery', 'Installation'];

/** Which services a scope preset switches on. */
export const SCOPE_SERVICES = {
  'Design only': ['Design'],
  'Packing only': ['Packing'],
  'Design + Packing': ['Design', 'Packing'],
  'Complete project': ['Design', 'Production', 'Packing', 'Delivery'],
  Custom: [],
};

export const CITIES = ['Bangalore', 'Kochi', 'Chennai', 'Hyderabad', 'Mumbai'];

export const ENQUIRY_STATUSES = ['New', 'Follow-up', 'Quotation sent', 'Negotiation', 'Converted', 'Lost'];

/** Badge tone for every status-like value used across the app. */
export const STATUS_TONES = {
  'In progress': 'blue',
  Upcoming: 'sky',
  'On hold': 'amber',
  Completed: 'green',
  Cancelled: 'red',
  Overdue: 'red',
  High: 'red',
  Medium: 'amber',
  Low: 'slate',
  New: 'violet',
  'Follow-up': 'orange',
  'Quotation sent': 'blue',
  Negotiation: 'amber',
  Converted: 'green',
  Lost: 'slate',
  Active: 'green',
  Inactive: 'slate',
  Invited: 'amber',
  Preferred: 'green',
  Approved: 'blue',
  'Not started': 'slate',
  Done: 'green',
  Admin: 'navy',
  Manager: 'orange',
  Staff: 'slate',
};
