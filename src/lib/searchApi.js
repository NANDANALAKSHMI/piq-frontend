import { auth } from './firebase.js';

/**
 * Browser side of the Algolia search. It never sees an Algolia key: it calls /api/search and
 * /api/search-sync, which check the Firebase sign-in and talk to Algolia from the server.
 */

/** Set once the server says Algolia isn't set up, so the app stops asking and searches locally. */
let unavailable = false;
export const isSearchAvailable = () => !unavailable;

async function post(path, payload) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) return { ok: false, skipped: true };
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => null);
  if (response.status === 501 || response.status === 404 || !result) {
    unavailable = true; // not configured (501), or the API isn't running here (404 / not JSON)
    return { ok: false, unavailable: true };
  }
  if (!response.ok || !result.ok) throw new Error(result.error ?? `Search failed (${response.status}).`);
  return result;
}

/** Ids of the `entity` records matching `query`, best first. Resolves to null when search isn't available. */
export async function searchIds(entity, query) {
  if (unavailable) return null;
  const result = await post('/api/search', { entity, query });
  return result.ok ? result.ids : null;
}

/** Adds/updates `upserts` and removes `deletes` in the search index. Resolves to true when it was applied. */
export async function syncRecords(entity, upserts, deletes) {
  if (unavailable) return false;
  const result = await post('/api/search-sync', { entity, upserts, deletes });
  return Boolean(result.ok);
}
