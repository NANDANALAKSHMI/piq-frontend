/**
 * What goes into the Algolia index for each record type: short searchable text only, never the whole
 * document (no comments, activity log or notes). Keep these small — they are sent to the server.
 */
const text = (...parts) => parts.filter(Boolean).join(' ');

export function projectRecord(project, clients) {
  const client = clients.find((c) => c.id === project.clientId);
  const location = client?.locations.find((l) => l.id === project.locationId);
  return {
    objectID: project.id,
    name: project.name,
    clientName: client?.name ?? '',
    city: location?.city ?? '',
    description: project.description,
    quantity: project.quantity,
    status: project.status,
    priority: project.priority,
    services: project.services.map((s) => s.name),
  };
}

export const clientRecord = (client) => ({
  objectID: client.id,
  name: client.name,
  contactName: client.contactName,
  designation: client.designation,
  phone: client.phone,
  email: client.email,
  gstin: client.gstin,
  places: client.locations.map((l) => text(l.name, l.address, l.city, l.district, l.state, l.pin)),
});

export const enquiryRecord = (enquiry) => ({
  objectID: enquiry.id,
  company: enquiry.company,
  contactName: enquiry.contactName,
  phone: enquiry.phone,
  email: enquiry.email,
  city: enquiry.city,
  state: enquiry.state,
  location: enquiry.location,
  source: enquiry.source,
  status: enquiry.status,
  services: enquiry.services,
});

export const vendorRecord = (vendor) => ({
  objectID: vendor.id,
  name: vendor.name,
  contactPerson: vendor.contactPerson,
  phone: vendor.phone,
  email: vendor.email,
  city: vendor.city,
  district: vendor.district,
  state: vendor.state,
  address: vendor.address,
  status: vendor.status,
});

export const memberRecord = (member) => ({
  objectID: member.id,
  name: member.name,
  email: member.email,
  phone: member.phone,
  title: member.title,
  status: member.status,
});
