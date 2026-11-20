import { liteClient } from 'algoliasearch/lite';
import { auth } from './firebase.js';

/**
 * Server-side search through Algolia. Firestore → Algolia syncing is done by the Firebase
 * "Search Firestore with Algolia" extension (one install per collection); this module only searches.
 *
 * The browser never holds a permanent key: it asks /api/algolia-key (signed-in team members only)
 * for a key that is limited to PIQ's indices and expires after an hour, and refreshes it as needed.
 * If the server has no Algolia settings, `getSearch()` resolves to null and pages search in the
 * browser instead.
 *
 * This module is loaded on demand (dynamic import) so the Algolia client stays out of the first page load.
 */

let cached = null; // { client, prefix, validUntil } | { disabled: true, until }
let pending = null;

async function fetchKey() {
  const user = auth?.currentUser;
  if (!user) return { disabled: true, until: 0 };
  const token = await user.getIdToken();
  let response;
  try {
    response = await fetch('/api/algolia-key', { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error('Could not reach the search service. Check your connection.');
  }
  const result = await response.json().catch(() => null);
  // Not set up (or no API in this environment): fall back to browser search for 5 minutes, then re-check.
  if (response.status === 501 || response.status === 404 || !result) return { disabled: true, until: Date.now() + 5 * 60_000 };
  if (!response.ok || !result.ok) throw new Error(result.error ?? `Search is unavailable (${response.status}).`);
  return { client: liteClient(result.appId, result.key), prefix: result.prefix ?? '', validUntil: result.validUntil * 1000 };
}

/** { client, indexName(name) } ready to search, or null when Algolia isn't set up. */
export async function getSearch() {
  const fresh = cached && (cached.disabled ? Date.now() < cached.until : Date.now() < cached.validUntil - 60_000);
  if (!fresh) {
    pending ??= fetchKey().finally(() => {
      pending = null;
    });
    cached = await pending;
  }
  if (cached.disabled) return null;
  const { client, prefix } = cached;
  return { client, indexName: (name) => `${prefix}${name}` };
}

/**
 * Runs one or more queries against an index in a single request.
 * `queries` = [{ query, filters, page, hitsPerPage, facets }] → Algolia results in the same order.
 */
export async function searchIndex(name, queries) {
  const search = await getSearch();
  if (!search) return null;
  const { results } = await search.client.search({
    requests: queries.map((q) => ({
      indexName: search.indexName(name),
      query: q.query ?? '',
      filters: q.filters ?? '',
      page: q.page ?? 0,
      hitsPerPage: q.hitsPerPage ?? 10,
      facets: q.facets ?? [],
      attributesToRetrieve: ['objectID'],
      attributesToHighlight: [],
      analytics: false,
    })),
  });
  return results;
}

/** Quotes a value for an Algolia filter: status:"In progress". */
export const facet = (attribute, value) => `${attribute}:${JSON.stringify(String(value))}`;
