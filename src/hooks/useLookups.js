import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';

/** Id → record lookups shared by pages that render projects. */
export default function useLookups() {
  const { clients, knownMembers } = useAppData();

  return useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]));
    const memberMap = new Map(knownMembers.map((m) => [m.id, m]));

    const getClient = (id) => clientMap.get(id);
    const getLocation = (clientId, locationId) => clientMap.get(clientId)?.locations.find((l) => l.id === locationId);

    return {
      getClient,
      getLocation,
      getMember: (id) => memberMap.get(id),
      membersFor: (ids = []) => ids.map((id) => memberMap.get(id)).filter(Boolean),
      projectCity: (project) => getLocation(project.clientId, project.locationId)?.city || '—',
    };
  }, [clients, knownMembers]);
}
