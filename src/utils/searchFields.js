/**
 * Extra fields saved on project documents purely so Algolia can filter and search them
 * (the Firestore → Algolia extension copies documents as they are, without lookups).
 * Bump SEARCH_VERSION when this shape changes; older documents are updated automatically.
 */
export const SEARCH_VERSION = 1;

/** "2026-11-20" → start of that day in ms (local time), for numeric filters like dueTs < today. */
export const dayTs = (iso) => (iso ? new Date(`${iso}T00:00:00`).getTime() : null);

export function projectSearchFields(project, clients) {
  const client = clients.find((c) => c.id === project.clientId);
  const location = client?.locations.find((l) => l.id === project.locationId);
  return {
    // The project number, so searching "PRJ-0012" finds it (Algolia can't search its objectID).
    ...(project.id ? { code: project.id } : {}),
    clientName: client?.name ?? '',
    city: location?.city ?? '',
    state: location?.state ?? '',
    serviceIds: (project.services ?? []).map((s) => s.serviceId),
    serviceNames: (project.services ?? []).map((s) => s.name),
    dueTs: dayTs(project.dueDate),
    // Left at 0 when the client isn't loaded yet, so the fields are filled in again later.
    searchVersion: client ? SEARCH_VERSION : 0,
  };
}
