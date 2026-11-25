import { HttpError } from './firebaseToken.js';
import { env } from './auth.js';

/**
 * Minimal Algolia REST client (no extra package). Keys stay on the server: the browser only ever
 * talks to /api/search and /api/search-sync, which check that the caller is signed in to Box Theory.
 *
 *   ALGOLIA_APP_ID        Algolia → Settings → API Keys → Application ID
 *   ALGOLIA_ADMIN_KEY     Admin API key (used to write records)         — server only
 *   ALGOLIA_SEARCH_KEY    Search-only API key (optional; defaults to the admin key)
 *   ALGOLIA_INDEX_PREFIX  Optional index name prefix, default "piq" (indexes: piq_projects, piq_clients…)
 */

/** The record types that are searchable. The key is the name the browser sends. */
export const ENTITIES = ['projects', 'clients', 'enquiries', 'vendors', 'members'];

export function algoliaConfig() {
  const appId = env('ALGOLIA_APP_ID');
  const adminKey = env('ALGOLIA_ADMIN_KEY');
  const searchKey = env('ALGOLIA_SEARCH_KEY', adminKey);
  return { appId, adminKey, searchKey, prefix: env('ALGOLIA_INDEX_PREFIX', 'piq'), configured: Boolean(appId && adminKey) };
}

export function indexName(entity) {
  if (!ENTITIES.includes(entity)) throw new HttpError(400, 'Unknown search type.');
  return `${algoliaConfig().prefix}_${entity}`;
}

/** Algolia's own fallback hosts, tried when the main address can't be reached (as its official clients do). */
const fallbackHosts = (appId) => [1, 2, 3].map((n) => `${appId}-${n}.algolianet.com`);

async function call({ hosts, key, appId, path, body }) {
  let response = null;
  for (const host of [...hosts, ...fallbackHosts(appId)]) {
    try {
      response = await fetch(`https://${host}${path}`, {
        method: 'POST',
        headers: { 'X-Algolia-Application-Id': appId, 'X-Algolia-API-Key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(6000),
      });
      break; // got an answer (even an error answer): don't retry on another host
    } catch {
      // host unreachable: try the next one
    }
  }
  if (!response) throw new HttpError(502, 'Could not reach Algolia. Please try again.');
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    console.error('[algolia]', response.status, detail?.message);
    throw new HttpError(502, response.status === 403 ? 'Algolia refused the API key. Check ALGOLIA_ADMIN_KEY / ALGOLIA_SEARCH_KEY.' : 'Algolia returned an error.');
  }
  return response.json();
}

/** Returns the objectIDs matching `query`, best match first (typo tolerant). */
export async function searchIds(entity, query, limit = 1000) {
  const { appId, searchKey } = algoliaConfig();
  const result = await call({
    hosts: [`${appId}-dsn.algolia.net`],
    key: searchKey,
    appId,
    path: `/1/indexes/${encodeURIComponent(indexName(entity))}/query`,
    body: { query, hitsPerPage: limit, attributesToRetrieve: ['objectID'], attributesToHighlight: [] },
  });
  return (result.hits ?? []).map((hit) => hit.objectID);
}

/** Adds / updates `upserts` ([{ objectID, ...fields }]) and removes `deletes` ([objectID]) in one batch. */
export async function writeRecords(entity, upserts, deletes) {
  const { appId, adminKey } = algoliaConfig();
  const requests = [
    ...upserts.map((body) => ({ action: 'updateObject', body })),
    ...deletes.map((objectID) => ({ action: 'deleteObject', body: { objectID } })),
  ];
  if (!requests.length) return;
  await call({
    hosts: [`${appId}.algolia.net`],
    key: adminKey,
    appId,
    path: `/1/indexes/${encodeURIComponent(indexName(entity))}/batch`,
    body: { requests },
  });
}
