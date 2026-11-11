import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { isFirebaseConfigured } from '../lib/firebase.js';
import { describeFirestoreError } from '../lib/memberUtils.js';

/** Firestore helpers load on demand, keeping the SDK out of the first page load. */
const loadServicesApi = () => import('../lib/services.js');

const NO_SERVICES = [];

/** Runs a services.js function and turns Firestore failures into plain-language errors. */
const call = (name) => async (...args) => {
  try {
    const api = await loadServicesApi();
    return await api[name](...args);
  } catch (err) {
    throw new Error(describeFirestoreError(err));
  }
};

const actions = {
  addService: call('createService'),
  updateService: call('updateService'),
  removeService: call('deleteService'),
};

/**
 * Live services (with their sub-services) from Firestore, plus the actions that change them.
 * Every action returns a promise that rejects with a readable message.
 */
export default function useServices() {
  const { user } = useAuth();
  const key = user && isFirebaseConfigured ? user.email : null;
  const [snapshot, setSnapshot] = useState({ key: null, list: NO_SERVICES, error: null });

  useEffect(() => {
    if (!key) return undefined;
    let unsubscribe = null;
    let cancelled = false;
    loadServicesApi()
      .then(({ subscribeToServices }) => {
        if (cancelled) return;
        unsubscribe = subscribeToServices(
          (list) => setSnapshot({ key, list, error: null }),
          (err) =>
            setSnapshot((current) => ({
              key,
              list: current.key === key ? current.list : NO_SERVICES,
              error: describeFirestoreError(err),
            })),
        );
      })
      .catch(() => setSnapshot({ key, list: NO_SERVICES, error: 'Could not load the services. Refresh the page and try again.' }));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [key]);

  const synced = key !== null && snapshot.key === key;

  return useMemo(
    () => ({
      services: synced ? snapshot.list : NO_SERVICES,
      loading: key !== null && !synced,
      error: key === null ? 'Services are stored in Firestore. Add the Firebase settings to .env.local to manage them.' : synced ? snapshot.error : null,
      ...actions,
    }),
    [key, synced, snapshot],
  );
}
