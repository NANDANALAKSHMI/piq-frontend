/** People who can sign in to PIQ. */
export const teamMembers = [
  { id: 'u1', name: 'Anil S', email: 'anil@piq.in', phone: '+91 98450 10001', role: 'Admin', title: 'Operations head', lastActive: 'Now', status: 'Active', color: 'bg-brand-ink' },
  { id: 'u2', name: 'Rajesh Kumar', email: 'rajesh@piq.in', phone: '+91 98450 10002', role: 'Manager', title: 'Operations manager', lastActive: '12 min ago', status: 'Active', color: 'bg-blue-700' },
  { id: 'u3', name: 'Priya Menon', email: 'priya@piq.in', phone: '+91 98450 10003', role: 'Manager', title: 'Operations manager', lastActive: '48 min ago', status: 'Active', color: 'bg-pink-700' },
  { id: 'u4', name: 'Sunil Nair', email: 'sunil@piq.in', phone: '+91 98450 10004', role: 'Manager', title: 'Operations manager', lastActive: 'Yesterday', status: 'Active', color: 'bg-green-700' },
  { id: 'u5', name: 'Neha Patel', email: 'neha@piq.in', phone: '+91 98450 10005', role: 'Manager', title: 'Operations manager', lastActive: '2 h ago', status: 'Active', color: 'bg-slate-600' },
  { id: 'u6', name: 'Arun Joseph', email: 'arun@piq.in', phone: '+91 98450 10006', role: 'Staff', title: 'Packaging designer', lastActive: '40 min ago', status: 'Active', color: 'bg-violet-700' },
  { id: 'u7', name: 'Vijay S', email: 'vijay@piq.in', phone: '+91 98450 10007', role: 'Staff', title: 'Packing supervisor', lastActive: '3 h ago', status: 'Active', color: 'bg-teal-700' },
  { id: 'u8', name: 'Anjali Varma', email: 'anjali@piq.in', phone: '+91 98450 10008', role: 'Staff', title: 'Packaging designer', lastActive: '5 h ago', status: 'Active', color: 'bg-rose-700' },
  { id: 'u9', name: 'Mohan N', email: 'mohan@piq.in', phone: '+91 98450 10009', role: 'Staff', title: 'Logistics coordinator', lastActive: '1 h ago', status: 'Active', color: 'bg-indigo-700' },
  { id: 'u10', name: 'Karthik M', email: 'karthik@piq.in', phone: '+91 98450 10010', role: 'Staff', title: 'Helper', lastActive: '—', status: 'Invited', color: 'bg-slate-500' },
];

export const currentUserId = 'u1';

export function getMember(id) {
  return teamMembers.find((member) => member.id === id);
}
