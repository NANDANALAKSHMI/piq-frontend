export const vendorCategories = [
  { id: 'vc-wood', name: 'Wood & timber', description: 'Pine, plywood, pallets', tone: 'orange' },
  { id: 'vc-corrugated', name: 'Corrugated boxes', description: 'Cartons, 3/5/7-ply sheets', tone: 'blue' },
  { id: 'vc-protective', name: 'Protective materials', description: 'Foam, bubble, VCI, stretch film', tone: 'violet' },
  { id: 'vc-printing', name: 'Printing & labels', description: 'Branding, stencils, labels', tone: 'sky' },
  { id: 'vc-transport', name: 'Transport & logistics', description: 'Trucks, cranes, forklifts', tone: 'green' },
  { id: 'vc-hardware', name: 'Hardware & fasteners', description: 'Bolts, straps, clamps', tone: 'amber' },
];

export const vendors = [
  { id: 'v1', name: 'Sri Balaji Timbers', categoryIds: ['vc-wood', 'vc-hardware'], city: 'Chennai', contact: 'Murali K', phone: '+91 98410 22871', address: 'Red Hills Road, Chennai', supplies: ['ISPM-15 pine', 'Plywood'], leadDays: 3, payment: '30 days credit', status: 'Preferred', unitIds: ['chn', 'blr'], rating: 4.8, jobsUsed: 11 },
  { id: 'v2', name: 'Coastal Wood Works', categoryIds: ['vc-wood'], city: 'Kochi', contact: 'Shaji P', phone: '+91 94470 61230', address: 'Edappally, Kochi', supplies: ['Rubberwood', 'Pallets'], leadDays: 2, payment: 'Advance 50%', status: 'Preferred', unitIds: ['kch'], rating: 4.6, jobsUsed: 7 },
  { id: 'v3', name: 'Deccan Ply & Pallets', categoryIds: ['vc-wood'], city: 'Bangalore', contact: 'Ravi T', phone: '+91 99000 33412', address: 'Peenya 2nd Stage, Bangalore', supplies: ['Plywood', 'Pallets'], leadDays: 2, payment: '15 days credit', status: 'Preferred', unitIds: ['blr'], rating: 4.5, jobsUsed: 9 },
  { id: 'v4', name: 'Hyderabad Timber Mart', categoryIds: ['vc-wood'], city: 'Hyderabad', contact: 'Imran S', phone: '+91 98480 11290', address: 'Balanagar, Hyderabad', supplies: ['Pine'], leadDays: 4, payment: 'Advance', status: 'Approved', unitIds: ['hyd'], rating: 4.1, jobsUsed: 3 },
  { id: 'v5', name: 'GreenLine Pallets', categoryIds: ['vc-wood'], city: 'Chennai', contact: 'Arvind M', phone: '+91 98402 77654', address: 'Ambattur, Chennai', supplies: ['Pallets'], leadDays: 5, payment: '30 days credit', status: 'Approved', unitIds: ['chn'], rating: 4.0, jobsUsed: 2 },
  { id: 'v6', name: 'Malabar Saw Mills', categoryIds: ['vc-wood'], city: 'Kochi', contact: 'Joy V', phone: '+91 94950 44021', address: 'Perumbavoor, Kochi', supplies: ['Hardwood'], leadDays: 6, payment: 'Advance', status: 'On hold', unitIds: ['kch'], rating: 3.4, jobsUsed: 1 },
  { id: 'v7', name: 'BoxCraft Corrugators', categoryIds: ['vc-corrugated'], city: 'Bangalore', contact: 'Harish B', phone: '+91 99860 12345', address: 'Bommasandra, Bangalore', supplies: ['5-ply cartons', '7-ply sheets'], leadDays: 3, payment: '30 days credit', status: 'Preferred', unitIds: ['blr', 'chn'], rating: 4.7, jobsUsed: 14 },
  { id: 'v8', name: 'Kerala Cartons', categoryIds: ['vc-corrugated'], city: 'Kochi', contact: 'Biju M', phone: '+91 94470 88123', address: 'Kalamassery, Kochi', supplies: ['3-ply cartons', 'Die-cut boxes'], leadDays: 4, payment: '15 days credit', status: 'Approved', unitIds: ['kch'], rating: 4.2, jobsUsed: 6 },
  { id: 'v9', name: 'Polypack Industries', categoryIds: ['vc-protective'], city: 'Chennai', contact: 'Senthil R', phone: '+91 98400 55671', address: 'Guindy, Chennai', supplies: ['VCI film', 'EPE foam', 'Bubble wrap'], leadDays: 2, payment: '30 days credit', status: 'Preferred', unitIds: ['chn', 'blr', 'hyd'], rating: 4.9, jobsUsed: 18 },
  { id: 'v10', name: 'SafeWrap Supplies', categoryIds: ['vc-protective'], city: 'Bangalore', contact: 'Nikhil D', phone: '+91 98451 77320', address: 'Yeshwanthpur, Bangalore', supplies: ['Stretch film', 'Corner guards'], leadDays: 1, payment: 'Advance', status: 'Approved', unitIds: ['blr'], rating: 4.3, jobsUsed: 8 },
  { id: 'v11', name: 'Print Point Labels', categoryIds: ['vc-printing'], city: 'Bangalore', contact: 'Asha G', phone: '+91 99001 66218', address: 'Rajajinagar, Bangalore', supplies: ['Labels', 'Stencils'], leadDays: 2, payment: '15 days credit', status: 'Preferred', unitIds: ['blr', 'chn'], rating: 4.6, jobsUsed: 10 },
  { id: 'v12', name: 'Colour Graphics', categoryIds: ['vc-printing'], city: 'Kochi', contact: 'Ajith K', phone: '+91 94473 90011', address: 'Vyttila, Kochi', supplies: ['Offset printing', 'Branding'], leadDays: 5, payment: 'Advance 50%', status: 'Approved', unitIds: ['kch'], rating: 4.2, jobsUsed: 4 },
  { id: 'v13', name: 'Southern Heavy Movers', categoryIds: ['vc-transport'], city: 'Chennai', contact: 'Ganesh P', phone: '+91 98410 99812', address: 'Madhavaram, Chennai', supplies: ['Trailers', 'Cranes'], leadDays: 2, payment: '30 days credit', status: 'Preferred', unitIds: ['chn', 'blr'], rating: 4.7, jobsUsed: 12 },
  { id: 'v14', name: 'Kaveri Logistics', categoryIds: ['vc-transport'], city: 'Bangalore', contact: 'Manju S', phone: '+91 99800 12765', address: 'Hoskote, Bangalore', supplies: ['Closed trucks', 'Forklifts'], leadDays: 1, payment: '15 days credit', status: 'Preferred', unitIds: ['blr'], rating: 4.5, jobsUsed: 15 },
  { id: 'v15', name: 'Deccan Freight', categoryIds: ['vc-transport'], city: 'Hyderabad', contact: 'Rahul V', phone: '+91 98490 33004', address: 'Shamshabad, Hyderabad', supplies: ['Reefer trucks'], leadDays: 2, payment: 'Advance', status: 'Approved', unitIds: ['hyd'], rating: 4.0, jobsUsed: 3 },
  { id: 'v16', name: 'Ambattur Bolt House', categoryIds: ['vc-hardware'], city: 'Chennai', contact: 'Selvam A', phone: '+91 98402 11903', address: 'Ambattur OT, Chennai', supplies: ['Bolts', 'Steel straps'], leadDays: 1, payment: 'Cash', status: 'Preferred', unitIds: ['chn'], rating: 4.4, jobsUsed: 9 },
];

export function getVendorCategory(id) {
  return vendorCategories.find((category) => category.id === id);
}
