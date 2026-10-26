import { daysFromToday } from '../utils/formatters.js';
import { SCOPE_SERVICES } from './constants.js';

const DEFAULT_OWNER_BY_SERVICE = {
  'Site survey': 'u7',
  Design: 'u6',
  Production: 'u3',
  Packing: 'u7',
  Delivery: 'u9',
  Installation: 'u2',
};

function defaultServices(scope, status, customServices = []) {
  const names = scope === 'Custom' ? customServices : SCOPE_SERVICES[scope];
  return names.map((name, index) => {
    let progress = 0;
    if (status === 'Completed') progress = 100;
    else if (status === 'In progress' || status === 'On hold') progress = index === 0 ? 50 : 0;
    return { name, ownerId: DEFAULT_OWNER_BY_SERVICE[name], progress };
  });
}

/** Builds a job record with sensible defaults so the list below stays readable. */
function createJob({ start, due, services, customServices, ...job }) {
  return {
    teamIds: [],
    vendorIds: [],
    media: [],
    comments: [],
    activity: [],
    keyDecision: null,
    createdFrom: null,
    description: '',
    ...job,
    startDate: daysFromToday(start),
    dueDate: daysFromToday(due),
    services: services ?? defaultServices(job.scope, job.status, customServices),
  };
}

export const jobs = [
  createJob({
    id: 'JOB-0113', name: 'Electronics Relocation', clientId: 'c8', locationId: 'c8-l1', categoryId: 'cat-relocation', subcategory: 'Office move',
    unitId: 'blr', scope: 'Custom', customServices: ['Packing', 'Delivery', 'Installation'], templateId: 'wf-relocation', currentStage: 0,
    status: 'Upcoming', priority: 'Low', start: 5, due: 15, teamIds: ['u2', 'u9'], createdFrom: 'ENQ-045',
    description: 'Move of 120 workstations and 6 server racks to the new campus. Weekend packing preferred.',
  }),
  createJob({
    id: 'JOB-0112', name: 'Office Equipment Packing', clientId: 'c2', locationId: 'c2-l1', categoryId: 'cat-commercial', subcategory: 'Office equipment',
    unitId: 'blr', scope: 'Packing only', templateId: 'wf-packing', currentStage: 2, status: 'In progress', priority: 'High', start: -6, due: 2,
    teamIds: ['u2', 'u9'], vendorIds: ['v10', 'v14'],
    services: [{ name: 'Packing', ownerId: 'u2', progress: 60 }],
    description: 'Packing and crating of office equipment including computers, printers and delicate electronics for relocation.',
    media: [
      { id: 'm1', type: 'image', title: 'Workstations — floor 3', uploadedBy: 'u9', when: '2 days ago' },
      { id: 'm2', type: 'image', title: 'Printer crates', uploadedBy: 'u2', when: 'Yesterday' },
    ],
    comments: [
      { id: 'cm1', authorId: 'u9', role: 'Logistics', minutesAgo: 180, text: 'Truck booked with Kaveri Logistics for Saturday 7 AM.' },
    ],
    activity: [
      { id: 'a1', type: 'stage', text: 'Stage moved to Packing', by: 'u2', when: 'Today, 9:10 AM' },
      { id: 'a2', type: 'created', text: 'Job created', by: 'u1', when: '6 days ago' },
    ],
  }),
  createJob({
    id: 'JOB-0111', name: 'Retail Gift Box Range', clientId: 'c3', locationId: 'c3-l1', categoryId: 'cat-product', subcategory: 'Gift boxes',
    unitId: 'kch', scope: 'Design + Packing', templateId: 'wf-product', currentStage: 2, status: 'In progress', priority: 'Medium', start: -10, due: 6,
    teamIds: ['u4', 'u8'], vendorIds: ['v8', 'v12'],
    services: [{ name: 'Design', ownerId: 'u8', progress: 70 }, { name: 'Packing', ownerId: 'u4', progress: 0 }],
    description: 'Festive gift-box range in three sizes with foil-printed sleeves.',
    comments: [
      { id: 'cm1', authorId: 'u4', role: 'Unit manager', minutesAgo: 1500, text: 'Client wants the large box 10 mm taller. Anjali to revise the dieline.' },
    ],
  }),
  createJob({
    id: 'JOB-0110', name: 'Industrial Machine Crating', clientId: 'c1', locationId: 'c1-l1', categoryId: 'cat-crating', subcategory: 'Heavy machinery',
    unitId: 'chn', scope: 'Complete project', templateId: 'wf-crating', currentStage: 3, status: 'In progress', priority: 'High', start: -12, due: 9,
    teamIds: ['u3', 'u6', 'u7', 'u10'], vendorIds: ['v1', 'v9', 'v16', 'v13'], createdFrom: 'ENQ-038',
    services: [
      { name: 'Design', ownerId: 'u6', progress: 100 },
      { name: 'Production', ownerId: 'u3', progress: 60 },
      { name: 'Packing', ownerId: 'u7', progress: 0 },
      { name: 'Delivery', ownerId: 'u2', progress: 0 },
    ],
    description: 'Design and build export-grade wooden crates for 3 CNC machines (approx. 2.4 t each), including VCI wrapping, shock indicators and loading supervision at the client’s plant.',
    keyDecision: { text: 'Client approved heat-treated pine (ISPM-15) instead of plywood.', by: 'Vikram Singh', when: '3 days ago' },
    media: [
      { id: 'm1', type: 'image', title: 'Site survey · bay 2', uploadedBy: 'u7', when: '10 days ago' },
      { id: 'm2', type: 'image', title: 'Crate base frame', uploadedBy: 'u3', when: '2 days ago' },
      { id: 'm3', type: 'video', title: 'Load test · 0:42', uploadedBy: 'u3', when: 'Yesterday' },
      { id: 'm4', type: 'document', title: 'Crate drawing v3.pdf', uploadedBy: 'u6', when: 'Today' },
      { id: 'm5', type: 'image', title: 'VCI film sample', uploadedBy: 'u7', when: 'Today' },
    ],
    comments: [
      { id: 'cm1', authorId: 'u3', role: 'Production', minutesAgo: 60, text: 'Crate 1 and 2 base frames done. Crate 3 needs an extra skid — machine footprint is 120 mm wider than the drawing.' },
      { id: 'cm2', authorId: 'u6', role: 'Design', minutesAgo: 40, text: 'Updated drawing v3 uploaded with the wider skid.' },
    ],
    activity: [
      { id: 'a1', type: 'media', text: 'Crate drawing v3.pdf uploaded', by: 'u6', when: 'Today' },
      { id: 'a2', type: 'stage', text: 'Stage moved to Production', by: 'u3', when: '3 days ago' },
      { id: 'a3', type: 'done', text: 'Design service marked complete', by: 'u6', when: '3 days ago' },
      { id: 'a4', type: 'created', text: 'Created from enquiry ENQ-038', by: 'u1', when: '12 days ago' },
    ],
  }),
  createJob({
    id: 'JOB-0109', name: 'Export Carton Redesign', clientId: 'c5', locationId: 'c5-l1', categoryId: 'cat-export', subcategory: 'Cartons',
    unitId: 'hyd', scope: 'Design only', templateId: 'wf-export', currentStage: 0, status: 'Upcoming', priority: 'Medium', start: 3, due: 12,
    teamIds: ['u6'], description: 'Redesign of export cartons for lighter board with the same stacking strength.',
  }),
  createJob({
    id: 'JOB-0108', name: 'Showroom Furniture Packing', clientId: 'c6', locationId: 'c6-l1', categoryId: 'cat-commercial', subcategory: 'Furniture',
    unitId: 'blr', scope: 'Packing only', templateId: 'wf-packing', currentStage: 4, status: 'Completed', priority: 'Low', start: -14, due: -4,
    teamIds: ['u2', 'u9'], vendorIds: ['v10'],
  }),
  createJob({
    id: 'JOB-0107', name: 'Pharma Cold-Chain Boxes', clientId: 'c4', locationId: 'c4-l1', categoryId: 'cat-product', subcategory: 'Insulated boxes',
    unitId: 'hyd', scope: 'Complete project', templateId: 'wf-product', currentStage: 3, status: 'In progress', priority: 'High', start: -16, due: -1,
    teamIds: ['u5', 'u8'], vendorIds: ['v9', 'v15'],
    services: [
      { name: 'Design', ownerId: 'u8', progress: 100 },
      { name: 'Production', ownerId: 'u5', progress: 50 },
      { name: 'Packing', ownerId: 'u5', progress: 0 },
      { name: 'Delivery', ownerId: 'u5', progress: 0 },
    ],
    description: 'Insulated shipper boxes holding 2–8 °C for 48 hours.',
  }),
  createJob({
    id: 'JOB-0106', name: 'Hotel Linen Packaging', clientId: 'c7', locationId: 'c7-l1', categoryId: 'cat-product', subcategory: 'Textile',
    unitId: 'kch', scope: 'Design + Packing', templateId: 'wf-product', currentStage: 2, status: 'On hold', priority: 'Medium', start: -8, due: 19,
    teamIds: ['u4'], description: 'Awaiting client approval on the printed sleeve artwork.',
  }),
  createJob({
    id: 'JOB-0105', name: 'Gearbox Spare Kits', clientId: 'c1', locationId: 'c1-l3', categoryId: 'cat-crating', subcategory: 'Spare parts',
    unitId: 'chn', scope: 'Packing only', templateId: 'wf-packing', currentStage: 2, status: 'In progress', priority: 'Medium', start: -3, due: 5,
    teamIds: ['u7'], vendorIds: ['v9'],
  }),
  createJob({
    id: 'JOB-0104', name: 'Spare Parts Kitting Boxes', clientId: 'c1', locationId: 'c1-l1', categoryId: 'cat-crating', subcategory: 'Spare parts',
    unitId: 'chn', scope: 'Packing only', templateId: 'wf-packing', currentStage: 1, status: 'In progress', priority: 'Low', start: -2, due: 17,
    teamIds: ['u7', 'u10'],
  }),
  createJob({
    id: 'JOB-0103', name: 'Lab Equipment Move', clientId: 'c4', locationId: 'c4-l1', categoryId: 'cat-relocation', subcategory: 'Office move',
    unitId: 'hyd', scope: 'Custom', customServices: ['Packing', 'Delivery'], templateId: 'wf-relocation', currentStage: 2, status: 'In progress',
    priority: 'Medium', start: -4, due: -3, teamIds: ['u5'],
    services: [{ name: 'Packing', ownerId: 'u5', progress: 70 }, { name: 'Delivery', ownerId: 'u5', progress: 0 }],
  }),
  createJob({
    id: 'JOB-0102', name: 'Festive Hamper Boxes', clientId: 'c3', locationId: 'c3-l1', categoryId: 'cat-product', subcategory: 'Gift boxes',
    unitId: 'kch', scope: 'Complete project', templateId: 'wf-product', currentStage: 6, status: 'Completed', priority: 'Medium', start: -30, due: -9,
    teamIds: ['u4', 'u8'],
  }),
  createJob({
    id: 'JOB-0101', name: 'Plant Relocation — Line B', clientId: 'c1', locationId: 'c1-l2', categoryId: 'cat-relocation', subcategory: 'Plant move',
    unitId: 'blr', scope: 'Custom', customServices: ['Site survey', 'Packing', 'Delivery'], templateId: 'wf-relocation', currentStage: 1,
    status: 'In progress', priority: 'High', start: -5, due: 35, teamIds: ['u2', 'u9'],
  }),
  createJob({
    id: 'JOB-0100', name: 'Data Centre Rack Packing', clientId: 'c8', locationId: 'c8-l1', categoryId: 'cat-commercial', subcategory: 'Office equipment',
    unitId: 'blr', scope: 'Packing only', templateId: 'wf-packing', currentStage: 4, status: 'Completed', priority: 'High', start: -25, due: -18,
    teamIds: ['u9'],
  }),
  createJob({
    id: 'JOB-0099', name: 'Hydraulic Press Crate', clientId: 'c1', locationId: 'c1-l1', categoryId: 'cat-crating', subcategory: 'Heavy machinery',
    unitId: 'chn', scope: 'Complete project', templateId: 'wf-crating', currentStage: 6, status: 'Completed', priority: 'Medium', start: -45, due: -22,
    teamIds: ['u3', 'u6'], vendorIds: ['v1'],
  }),
  createJob({
    id: 'JOB-0098', name: 'Export Pallets — Batch 4', clientId: 'c5', locationId: 'c5-l1', categoryId: 'cat-export', subcategory: 'Sea freight crates',
    unitId: 'chn', scope: 'Complete project', templateId: 'wf-export', currentStage: 6, status: 'Completed', priority: 'Medium', start: -40, due: -20,
    teamIds: ['u3'],
  }),
  createJob({
    id: 'JOB-0097', name: 'Warehouse Shelving Move', clientId: 'c2', locationId: 'c2-l1', categoryId: 'cat-relocation', subcategory: 'Office move',
    unitId: 'blr', scope: 'Custom', customServices: ['Packing', 'Delivery'], templateId: 'wf-relocation', currentStage: 1, status: 'Cancelled',
    priority: 'Low', start: -20, due: -10, teamIds: ['u2'],
  }),
  createJob({
    id: 'JOB-0096', name: 'Linen Range Sampling', clientId: 'c7', locationId: 'c7-l1', categoryId: 'cat-product', subcategory: 'Textile',
    unitId: 'kch', scope: 'Design only', templateId: 'wf-product', currentStage: 6, status: 'Completed', priority: 'Low', start: -35, due: -26,
    teamIds: ['u8'],
  }),
  createJob({
    id: 'JOB-0095', name: 'Server Room Packing', clientId: 'c8', locationId: 'c8-l1', categoryId: 'cat-commercial', subcategory: 'Office equipment',
    unitId: 'blr', scope: 'Packing only', templateId: 'wf-packing', currentStage: 0, status: 'Upcoming', priority: 'Medium', start: 8, due: 11,
    teamIds: ['u9'],
  }),
  createJob({
    id: 'JOB-0094', name: 'Vaccine Shipper Trial', clientId: 'c4', locationId: 'c4-l1', categoryId: 'cat-product', subcategory: 'Insulated boxes',
    unitId: 'hyd', scope: 'Design + Packing', templateId: 'wf-product', currentStage: 0, status: 'Upcoming', priority: 'High', start: 10, due: 24,
    teamIds: ['u5', 'u8'],
  }),
  createJob({
    id: 'JOB-0093', name: 'Showroom Restock Packing', clientId: 'c6', locationId: 'c6-l1', categoryId: 'cat-commercial', subcategory: 'Retail stock',
    unitId: 'blr', scope: 'Packing only', templateId: 'wf-packing', currentStage: 4, status: 'Completed', priority: 'Low', start: -12, due: -7,
    teamIds: ['u9'],
  }),
  createJob({
    id: 'JOB-0092', name: 'Electrical Panel Crates', clientId: 'c1', locationId: 'c1-l1', categoryId: 'cat-crating', subcategory: 'Electrical panels',
    unitId: 'chn', scope: 'Complete project', templateId: 'wf-crating', currentStage: 2, status: 'On hold', priority: 'Medium', start: -9, due: 14,
    teamIds: ['u3', 'u6'], description: 'Paused until the client confirms panel dimensions.',
  }),
  createJob({
    id: 'JOB-0091', name: 'Seasonal Gift Sleeves', clientId: 'c3', locationId: 'c3-l1', categoryId: 'cat-product', subcategory: 'Gift boxes',
    unitId: 'kch', scope: 'Design only', templateId: 'wf-product', currentStage: 6, status: 'Completed', priority: 'Low', start: -50, due: -38,
    teamIds: ['u8'],
  }),
  createJob({
    id: 'JOB-0090', name: 'Cold Room Panels Export', clientId: 'c5', locationId: 'c5-l1', categoryId: 'cat-export', subcategory: 'Sea freight crates',
    unitId: 'chn', scope: 'Complete project', templateId: 'wf-export', currentStage: 3, status: 'In progress', priority: 'High', start: -7, due: 10,
    teamIds: ['u3', 'u7'], vendorIds: ['v1', 'v13'],
  }),
];
