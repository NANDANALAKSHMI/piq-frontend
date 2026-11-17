import { useMemo } from 'react';
import useFirestoreList, { firestoreAction } from './useFirestoreList.js';

/** Firestore helpers load on demand, keeping the SDK out of the first page load. */
const load = () => import('../lib/services.js');

const actions = {
  addService: firestoreAction(load, 'createService'),
  updateService: firestoreAction(load, 'updateService'),
  removeService: firestoreAction(load, 'deleteService'),
};

/**
 * Live services (with their sub-services) from Firestore, plus the actions that change them.
 * Every action returns a promise that rejects with a readable message.
 */
export default function useServices() {
  const { list, loading, error } = useFirestoreList(load, 'subscribeToServices', 'services');
  return useMemo(() => ({ services: list, loading, error, ...actions }), [list, loading, error]);
}
