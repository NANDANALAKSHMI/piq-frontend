export const units = [
  { id: 'blr', name: 'Bangalore Unit', city: 'Bangalore', area: 'Peenya', state: 'Karnataka', managerId: 'u2', services: ['Design', 'Packing', 'Crating', 'Delivery'], status: 'Active' },
  { id: 'kch', name: 'Kochi Unit', city: 'Kochi', area: 'Kakkanad', state: 'Kerala', managerId: 'u4', services: ['Design', 'Packing'], status: 'Active' },
  { id: 'chn', name: 'Chennai Unit', city: 'Chennai', area: 'Ambattur', state: 'Tamil Nadu', managerId: 'u3', services: ['Production', 'Packing', 'Crating'], status: 'Active' },
  { id: 'hyd', name: 'Hyderabad Unit', city: 'Hyderabad', area: 'Uppal', state: 'Telangana', managerId: 'u5', services: ['Packing', 'Delivery'], status: 'Active' },
];

/** Workforce = staff with logins plus helpers who don't sign in. */
export const workforce = [
  { id: 'w1', name: 'Rajesh Kumar', role: 'Unit manager', unitId: 'blr', skills: ['Planning', 'Client visits'], availability: 'On job', phone: '+91 98450 10002' },
  { id: 'w2', name: 'Mohan N', role: 'Logistics coordinator', unitId: 'blr', skills: ['Delivery', 'Loading'], availability: 'On job', phone: '+91 98450 10009' },
  { id: 'w3', name: 'Deepak R', role: 'Packing supervisor', unitId: 'blr', skills: ['Packing', 'Fragile goods'], availability: 'Free', phone: '+91 90080 22110' },
  { id: 'w4', name: 'Imran K', role: 'Helper', unitId: 'blr', skills: ['Packing', 'Loading'], availability: 'Free', phone: '+91 90080 22111' },
  { id: 'w5', name: 'Sunil Nair', role: 'Unit manager', unitId: 'kch', skills: ['Planning', 'Design review'], availability: 'On job', phone: '+91 98450 10004' },
  { id: 'w6', name: 'Anjali Varma', role: 'Packaging designer', unitId: 'kch', skills: ['Design', 'Dielines'], availability: 'On job', phone: '+91 98450 10008' },
  { id: 'w7', name: 'Thomas J', role: 'Packing supervisor', unitId: 'kch', skills: ['Packing', 'Fragile goods'], availability: 'On job', phone: '+91 95620 33019' },
  { id: 'w8', name: 'Rahul B', role: 'Helper', unitId: 'kch', skills: ['Packing', 'Loading'], availability: 'Free', phone: '+91 90480 55621' },
  { id: 'w9', name: 'Priya Menon', role: 'Unit manager', unitId: 'chn', skills: ['Production', 'Planning'], availability: 'On job', phone: '+91 98450 10003' },
  { id: 'w10', name: 'Arun Joseph', role: 'Packaging designer', unitId: 'chn', skills: ['Design', 'Crate drawings'], availability: 'On job', phone: '+91 98450 10006' },
  { id: 'w11', name: 'Vijay S', role: 'Packing supervisor', unitId: 'chn', skills: ['Packing', 'VCI wrapping'], availability: 'On job', phone: '+91 98450 10007' },
  { id: 'w12', name: 'Karthik M', role: 'Helper', unitId: 'chn', skills: ['Carpentry'], availability: 'Free', phone: '+91 98450 10010' },
  { id: 'w13', name: 'Murugan P', role: 'Helper', unitId: 'chn', skills: ['Carpentry', 'Loading'], availability: 'On leave', phone: '+91 94440 71120' },
  { id: 'w14', name: 'Neha Patel', role: 'Unit manager', unitId: 'hyd', skills: ['Planning', 'Delivery'], availability: 'On job', phone: '+91 98450 10005' },
  { id: 'w15', name: 'Sai Kiran', role: 'Packing supervisor', unitId: 'hyd', skills: ['Packing'], availability: 'Free', phone: '+91 98480 66012' },
  { id: 'w16', name: 'Ravi T', role: 'Helper', unitId: 'hyd', skills: ['Loading'], availability: 'Free', phone: '+91 98480 66013' },
];

/** Distance (km) from each unit to each city — used to suggest the nearest unit. */
export const unitDistances = {
  Bangalore: { blr: 12, kch: 540, chn: 345, hyd: 570 },
  Kochi: { blr: 540, kch: 8, chn: 690, hyd: 1080 },
  Chennai: { blr: 345, kch: 690, chn: 14, hyd: 630 },
  Hyderabad: { blr: 570, kch: 1080, chn: 630, hyd: 10 },
  Mumbai: { blr: 980, kch: 1380, chn: 1330, hyd: 710 },
  Hosur: { blr: 42, kch: 580, chn: 305, hyd: 610 },
};

export function getUnit(id) {
  return units.find((unit) => unit.id === id);
}
