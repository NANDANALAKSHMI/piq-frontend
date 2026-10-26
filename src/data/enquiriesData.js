import { daysFromToday } from '../utils/formatters.js';

export const enquiries = [
  {
    id: 'ENQ-046', company: 'Tech Solutions', contactName: 'Meera Iyer', phone: '+91 98450 11223', email: 'meera@techsolutions.in',
    city: 'Bangalore', location: 'Whitefield, Bangalore', source: 'Phone call', services: ['Packing', 'Delivery'], scope: 'Custom',
    status: 'Follow-up', receivedOn: daysFromToday(-3), assignedTo: 'u2',
    notes: 'Office move of ~120 workstations and servers to new campus. Prefers weekend packing. Wants quote by end of month.',
    followUps: [
      { id: 'f1', title: 'Call to confirm site visit', date: daysFromToday(0), time: '3:00 PM', ownerId: 'u2', done: false },
      { id: 'f2', title: 'First call — requirements noted', date: daysFromToday(-3), time: '11:00 AM', ownerId: 'u1', done: true },
    ],
  },
  {
    id: 'ENQ-045', company: 'Retail Hub', contactName: 'Joseph Mathew', phone: '+91 94470 55120', email: 'joseph@retailhub.in',
    city: 'Kochi', location: 'Edappally, Kochi', source: 'Website', services: ['Packing'], scope: 'Packing only',
    status: 'Follow-up', receivedOn: daysFromToday(-5), assignedTo: 'u4',
    notes: 'Store transfer of 40 display units.',
    followUps: [{ id: 'f1', title: 'Send revised quote', date: daysFromToday(0), time: '5:30 PM', ownerId: 'u4', done: false }],
  },
  {
    id: 'ENQ-044', company: 'Metal Works Co.', contactName: 'Ravi Shankar', phone: '+91 98840 22311', email: 'ravi@metalworks.in',
    city: 'Chennai', location: 'Guindy, Chennai', source: 'Referral', services: ['Design', 'Production', 'Packing'], scope: 'Complete project',
    status: 'Quotation sent', receivedOn: daysFromToday(-9), assignedTo: 'u3',
    notes: 'Crating for 4 lathes going to Dubai.',
    followUps: [{ id: 'f1', title: 'Check on quotation', date: daysFromToday(2), time: '10:00 AM', ownerId: 'u3', done: false }],
  },
  {
    id: 'ENQ-043', company: 'Office Needs', contactName: 'Sana Khan', phone: '+91 99080 41122', email: 'sana@officeneeds.in',
    city: 'Hyderabad', location: 'Hitech City, Hyderabad', source: 'Phone call', services: ['Design'], scope: 'Design only',
    status: 'Negotiation', receivedOn: daysFromToday(-12), assignedTo: 'u5',
    notes: 'Branded stationery boxes; price-sensitive.',
    followUps: [{ id: 'f1', title: 'Final price discussion', date: daysFromToday(3), time: '12:00 PM', ownerId: 'u5', done: false }],
  },
  {
    id: 'ENQ-042', company: 'Global Traders', contactName: 'Farhan Ali', phone: '+91 98200 77881', email: 'farhan@globaltraders.in',
    city: 'Bangalore', location: 'Peenya, Bangalore', source: 'Email', services: ['Design', 'Production', 'Packing', 'Delivery'], scope: 'Complete project',
    status: 'New', receivedOn: daysFromToday(-1), assignedTo: null, notes: 'Export pallets for engineering goods.', followUps: [],
  },
  {
    id: 'ENQ-041', company: 'Spice Route Foods', contactName: 'Lakshmi R', phone: '+91 94950 33456', email: 'lakshmi@spiceroute.in',
    city: 'Kochi', location: 'Aluva, Kochi', source: 'Exhibition', services: ['Design', 'Packing'], scope: 'Design + Packing',
    status: 'Converted', receivedOn: daysFromToday(-20), assignedTo: 'u4', notes: 'Retail spice gift boxes.', followUps: [],
  },
  {
    id: 'ENQ-040', company: 'Sunrise Pharma', contactName: 'Dr. Kavitha', phone: '+91 98490 77120', email: 'kavitha@sunrisepharma.in',
    city: 'Hyderabad', location: 'Jeedimetla, Hyderabad', source: 'Referral', services: ['Design', 'Packing'], scope: 'Design + Packing',
    status: 'New', receivedOn: daysFromToday(-2), assignedTo: null, notes: 'Cold-chain shippers, pilot of 500 units.', followUps: [],
  },
  {
    id: 'ENQ-039', company: 'Urban Furnish', contactName: 'Nitin Rao', phone: '+91 99860 44102', email: 'nitin@urbanfurnish.in',
    city: 'Bangalore', location: 'HSR Layout, Bangalore', source: 'Website', services: ['Packing', 'Delivery'], scope: 'Custom',
    status: 'Lost', receivedOn: daysFromToday(-25), assignedTo: 'u2', notes: 'Went with a cheaper local mover.', followUps: [],
  },
  {
    id: 'ENQ-038', company: 'Deccan Machine Works', contactName: 'Vikram Singh', phone: '+91 98765 43214', email: 'vikram@deccanmw.in',
    city: 'Chennai', location: 'Ambattur, Chennai', source: 'Existing client', services: ['Design', 'Production', 'Packing', 'Delivery'], scope: 'Complete project',
    status: 'Converted', receivedOn: daysFromToday(-14), assignedTo: 'u3', notes: 'CNC machine crating.', followUps: [],
  },
];

export const ENQUIRY_SOURCES = ['Phone call', 'Website', 'Email', 'Referral', 'Exhibition', 'Existing client'];
