/** People who can sign in to PIQ. */
export const teamMembers = [
  { id: 'u1', name: 'Anil S', email: 'anil@piq.in', phone: '+91 98450 10001', role: 'Admin', title: 'Operations head', unitId: null, lastActive: 'Now', status: 'Active', color: 'bg-brand-ink' },
  { id: 'u2', name: 'Rajesh Kumar', email: 'rajesh@piq.in', phone: '+91 98450 10002', role: 'Manager', title: 'Unit manager', unitId: 'blr', lastActive: '12 min ago', status: 'Active', color: 'bg-blue-700' },
  { id: 'u3', name: 'Priya Menon', email: 'priya@piq.in', phone: '+91 98450 10003', role: 'Manager', title: 'Unit manager', unitId: 'chn', lastActive: '48 min ago', status: 'Active', color: 'bg-pink-700' },
  { id: 'u4', name: 'Sunil Nair', email: 'sunil@piq.in', phone: '+91 98450 10004', role: 'Manager', title: 'Unit manager', unitId: 'kch', lastActive: 'Yesterday', status: 'Active', color: 'bg-green-700' },
  { id: 'u5', name: 'Neha Patel', email: 'neha@piq.in', phone: '+91 98450 10005', role: 'Manager', title: 'Unit manager', unitId: 'hyd', lastActive: '2 h ago', status: 'Active', color: 'bg-slate-600' },
  { id: 'u6', name: 'Arun Joseph', email: 'arun@piq.in', phone: '+91 98450 10006', role: 'Staff', title: 'Packaging designer', unitId: 'chn', lastActive: '40 min ago', status: 'Active', color: 'bg-violet-700' },
  { id: 'u7', name: 'Vijay S', email: 'vijay@piq.in', phone: '+91 98450 10007', role: 'Staff', title: 'Packing supervisor', unitId: 'chn', lastActive: '3 h ago', status: 'Active', color: 'bg-teal-700' },
  { id: 'u8', name: 'Anjali Varma', email: 'anjali@piq.in', phone: '+91 98450 10008', role: 'Staff', title: 'Packaging designer', unitId: 'kch', lastActive: '5 h ago', status: 'Active', color: 'bg-rose-700' },
  { id: 'u9', name: 'Mohan N', email: 'mohan@piq.in', phone: '+91 98450 10009', role: 'Staff', title: 'Logistics coordinator', unitId: 'blr', lastActive: '1 h ago', status: 'Active', color: 'bg-indigo-700' },
  { id: 'u10', name: 'Karthik M', email: 'karthik@piq.in', phone: '+91 98450 10010', role: 'Staff', title: 'Helper', unitId: 'chn', lastActive: '—', status: 'Invited', color: 'bg-slate-500' },
];

export const currentUserId = 'u1';

export const ROLE_PERMISSIONS = [
  { permission: 'View jobs', Admin: 'yes', Manager: 'yes', Staff: 'Assigned only' },
  { permission: 'Create & edit jobs', Admin: 'yes', Manager: 'yes', Staff: 'no' },
  { permission: 'Update stage & status', Admin: 'yes', Manager: 'yes', Staff: 'yes' },
  { permission: 'Upload media & comment', Admin: 'yes', Manager: 'yes', Staff: 'yes' },
  { permission: 'Clients & enquiries', Admin: 'yes', Manager: 'yes', Staff: 'no' },
  { permission: 'Units & workforce', Admin: 'yes', Manager: 'Own unit', Staff: 'no' },
  { permission: 'Vendors', Admin: 'yes', Manager: 'yes', Staff: 'no' },
  { permission: 'Templates & categories', Admin: 'yes', Manager: 'no', Staff: 'no' },
  { permission: 'Team & permissions', Admin: 'yes', Manager: 'no', Staff: 'no' },
  { permission: 'Reports', Admin: 'yes', Manager: 'yes', Staff: 'no' },
];

export function getMember(id) {
  return teamMembers.find((member) => member.id === id);
}
