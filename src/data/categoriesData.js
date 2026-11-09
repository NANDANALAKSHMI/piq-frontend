export const jobCategories = [
  {
    id: 'cat-commercial',
    name: 'Commercial Packing',
    description: 'Office equipment, furniture and showroom stock',
    defaultScope: 'Packing only',
    vendorCategoryIds: ['vc-protective', 'vc-corrugated', 'vc-transport'],
    services: { 'Site survey': true, Design: false, Production: false, Packing: true, Delivery: true, Installation: false },
    subcategories: [
      { id: 'sc1', name: 'Office equipment', note: 'IT, printers, workstations', leadTime: '2–4 days', active: true },
      { id: 'sc2', name: 'Furniture', note: 'Showrooms and offices', leadTime: '2–3 days', active: true },
      { id: 'sc3', name: 'Retail stock', note: 'Store transfers', leadTime: '1–2 days', active: true },
      { id: 'sc4', name: 'Artwork', note: 'High value, insured', leadTime: '3–5 days', active: false },
    ],
  },
  {
    id: 'cat-product',
    name: 'Product Packaging',
    description: 'Branded boxes, gift ranges and retail packs',
    defaultScope: 'Design + Packing',
    vendorCategoryIds: ['vc-corrugated', 'vc-printing', 'vc-protective'],
    services: { 'Site survey': false, Design: true, Production: true, Packing: true, Delivery: true, Installation: false },
    subcategories: [
      { id: 'sc5', name: 'Gift boxes', note: 'Seasonal ranges', leadTime: '10–14 days', active: true },
      { id: 'sc6', name: 'Insulated boxes', note: 'Cold-chain', leadTime: '7–10 days', active: true },
      { id: 'sc7', name: 'Textile', note: 'Linen and garments', leadTime: '5–7 days', active: true },
    ],
  },
  {
    id: 'cat-crating',
    name: 'Industrial Crating',
    description: 'Heavy items that need custom wooden crates',
    defaultScope: 'Complete project',
    vendorCategoryIds: ['vc-wood', 'vc-protective', 'vc-hardware', 'vc-transport'],
    services: { 'Site survey': true, Design: true, Production: true, Packing: true, Delivery: true, Installation: false },
    subcategories: [
      { id: 'sc8', name: 'Heavy machinery', note: 'CNC, presses, gearboxes', leadTime: '12–18 days', active: true },
      { id: 'sc9', name: 'Spare parts', note: 'Kitted boxes on pallets', leadTime: '5–7 days', active: true },
      { id: 'sc10', name: 'Electrical panels', note: 'Moisture-sensitive', leadTime: '7–10 days', active: true },
    ],
  },
  {
    id: 'cat-export',
    name: 'Export Packaging',
    description: 'ISPM-15 compliant packing for shipping',
    defaultScope: 'Complete project',
    vendorCategoryIds: ['vc-wood', 'vc-corrugated', 'vc-printing', 'vc-transport'],
    services: { 'Site survey': true, Design: true, Production: true, Packing: true, Delivery: true, Installation: false },
    subcategories: [
      { id: 'sc11', name: 'Cartons', note: 'Export-grade 7-ply', leadTime: '5–7 days', active: true },
      { id: 'sc12', name: 'Sea freight crates', note: 'ISPM-15 timber', leadTime: '10–12 days', active: true },
    ],
  },
  {
    id: 'cat-relocation',
    name: 'Relocation',
    description: 'Office and plant moves, end to end',
    defaultScope: 'Custom',
    vendorCategoryIds: ['vc-transport', 'vc-protective'],
    services: { 'Site survey': true, Design: false, Production: false, Packing: true, Delivery: true, Installation: true },
    subcategories: [
      { id: 'sc13', name: 'Office move', note: 'Workstations and servers', leadTime: '3–5 days', active: true },
      { id: 'sc14', name: 'Plant move', note: 'Production lines', leadTime: '15–30 days', active: true },
    ],
  },
];

export const serviceCatalog = [
  { name: 'Site survey', ownerRole: 'Supervisor' },
  { name: 'Design', ownerRole: 'Designer' },
  { name: 'Production', ownerRole: 'Operations manager' },
  { name: 'Packing', ownerRole: 'Packing supervisor' },
  { name: 'Delivery', ownerRole: 'Logistics' },
  { name: 'Installation', ownerRole: 'Operations manager' },
];
