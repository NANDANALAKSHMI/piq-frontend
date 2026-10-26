import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { units } from '../data/unitsData.js';
import { jobCategories } from '../data/categoriesData.js';

/** Id → record lookups shared by pages that render jobs. */
export default function useLookups() {
  const { clients, members } = useAppData();

  return useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]));
    const memberMap = new Map(members.map((m) => [m.id, m]));
    const unitMap = new Map(units.map((u) => [u.id, u]));
    const categoryMap = new Map(jobCategories.map((c) => [c.id, c]));

    const getClient = (id) => clientMap.get(id);
    const getLocation = (clientId, locationId) => clientMap.get(clientId)?.locations.find((l) => l.id === locationId);

    return {
      getClient,
      getLocation,
      getMember: (id) => memberMap.get(id),
      getUnit: (id) => unitMap.get(id),
      getCategory: (id) => categoryMap.get(id),
      membersFor: (ids = []) => ids.map((id) => memberMap.get(id)).filter(Boolean),
      jobCity: (job) => getLocation(job.clientId, job.locationId)?.city ?? '—',
    };
  }, [clients, members]);
}
