import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { isFirebaseConfigured } from '../lib/firebase.js';

const loadAlgolia = () => import('../lib/algolia.js');
const NONE = [];

/**
 * Server-side search and filtering through Algolia.
 *
 * `request` = { index, query, filters, page (0-based), hitsPerPage, facets, extra: [{ filters, facets, … }] }
 * `refreshKey` changes when the underlying Firestore data changes, so results are fetched again.
 *
 * Returns:
 *   enabled  null while checking, false when Algolia isn't set up (pages then filter in the browser),
 *            true when results come from Algolia
 *   loading, error
 *   ids      object IDs (= Firestore document ids) of this page, in Algolia's order
 *   nbHits, nbPages, facets   from the main query
 *   extra    results of the `extra` queries (counts for tabs, etc.)
 */
export default function useServerSearch(request, refreshKey = '') {
  const { user } = useAuth();
  const signedIn = Boolean(user && isFirebaseConfigured);
  const [state, setState] = useState({ key: null, enabled: null, result: null, error: null });

  // One stable string for the whole request, so the effect only re-runs when something changed.
  const key = JSON.stringify([request, refreshKey]);

  useEffect(() => {
    if (!signedIn) return undefined;
    let cancelled = false;
    // Short pause so typing in the search box doesn't send a request per key press, and so a
    // just-saved record has time to reach Algolia through the Firebase extension.
    const timer = window.setTimeout(async () => {
      const { index, extra = [], ...main } = JSON.parse(key)[0];
      try {
        const { searchIndex } = await loadAlgolia();
        const results = await searchIndex(index, [main, ...extra]);
        if (cancelled) return;
        setState(results ? { key, enabled: true, result: results, error: null } : { key, enabled: false, result: null, error: null });
      } catch (err) {
        if (!cancelled) setState((current) => ({ key, enabled: current.enabled ?? true, result: current.result, error: err.message || 'Search failed. Please try again.' }));
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [key, signedIn]);

  return useMemo(() => {
    const [main, ...extra] = state.result ?? [];
    return {
      enabled: signedIn ? state.enabled : false,
      loading: signedIn && state.key !== key,
      error: state.error,
      ids: main?.hits?.map((hit) => hit.objectID) ?? NONE,
      nbHits: main?.nbHits ?? 0,
      nbPages: main?.nbPages ?? 0,
      facets: main?.facets ?? {},
      extra: extra ?? NONE,
    };
  }, [state, key, signedIn]);
}

/** Algolia filter helpers. */
export const quote = (value) => JSON.stringify(String(value));
export const eq = (attribute, value) => `${attribute}:${quote(value)}`;
export const all = (...parts) => parts.filter(Boolean).join(' AND ');
export const any = (...parts) => {
  const list = parts.filter(Boolean);
  return list.length > 1 ? `(${list.join(' OR ')})` : list[0] ?? '';
};

/** Changes whenever the Firestore list changes (new, removed or updated records). */
export const listVersion = (list) => `${list.length}:${list.reduce((latest, item) => Math.max(latest, item.updatedAt?.getTime?.() ?? 0), 0)}`;

/**
 * Current page (1-based) that goes back to page 1 whenever `filterKey` changes,
 * so a new search or filter never lands on an empty page.
 */
export function usePageFor(filterKey) {
  const [state, setState] = useState({ filterKey, page: 1 });
  const page = state.filterKey === filterKey ? state.page : 1;
  return [page, (next) => setState({ filterKey, page: next })];
}
