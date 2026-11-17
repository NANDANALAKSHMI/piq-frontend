import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { isFirebaseConfigured } from '../lib/firebase.js';
import { describeFirestoreError } from '../lib/memberUtils.js';

const EMPTY = [];

/**
 * Live Firestore list for whoever is signed in.
 * - `load` dynamically imports the lib module (keeps the Firestore SDK out of the first page load).
 * - `subscribe` is the name of its `subscribeTo…(onChange, onError)` export.
 * - `label` is used in messages, e.g. "vendors".
 * Returns { list, loading, error }.
 */
export default function useFirestoreList(load, subscribe, label) {
  const { user } = useAuth();
  const key = user && isFirebaseConfigured ? user.email : null;
  const [snapshot, setSnapshot] = useState({ key: null, list: EMPTY, error: null });

  useEffect(() => {
    if (!key) return undefined;
    let unsubscribe = null;
    let cancelled = false;
    load()
      .then((api) => {
        if (cancelled) return;
        unsubscribe = api[subscribe](
          (list) => setSnapshot({ key, list, error: null }),
          (err) =>
            setSnapshot((current) => ({
              key,
              list: current.key === key ? current.list : EMPTY,
              error: describeFirestoreError(err),
            })),
        );
      })
      .catch(() => setSnapshot({ key, list: EMPTY, error: `Could not load the ${label}. Refresh the page and try again.` }));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [key, load, subscribe, label]);

  const synced = key !== null && snapshot.key === key;

  return useMemo(
    () => ({
      list: synced ? snapshot.list : EMPTY,
      loading: key !== null && !synced,
      error:
        key === null
          ? `The ${label} are stored in Firestore. Add the Firebase settings to .env.local to manage them.`
          : synced
            ? snapshot.error
            : null,
    }),
    [key, synced, snapshot, label],
  );
}

/** Wraps a lib function so it loads on demand and rejects with a plain-language message. */
export const firestoreAction = (load, name) => async (...args) => {
  try {
    const api = await load();
    return await api[name](...args);
  } catch (err) {
    throw new Error(describeFirestoreError(err));
  }
};
