import { algoliasearch } from 'algoliasearch';
import { HttpError } from './_lib/firebaseToken.js';
import { env, requireTeamMember } from './_lib/teamAccess.js';

/**
 * GET /api/algolia-key — gives a signed-in Box Theory team member a short-lived Algolia search key.
 *
 * The key is a "secured API key" made from the search-only key: it can only search PIQ's indices
 * and stops working after an hour. Nobody outside the team gets one, and the search-only key
 * itself never reaches the browser.
 *
 * Environment (Vercel → Settings → Environment Variables, or .env.local for `npm run dev`):
 *   ALGOLIA_APP_ID          Algolia Application ID
 *   ALGOLIA_SEARCH_KEY      Algolia Search-Only API key (NOT the Admin key)
 *   ALGOLIA_INDEX_PREFIX    Optional, e.g. "piq_" if your index names start with it
 * When the first two are missing it answers 501, and the app keeps searching in the browser.
 */

const INDICES = ['projects', 'vendors', 'enquiries', 'clients'];
const VALID_SECONDS = 60 * 60;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Use GET.' });
  }
  res.setHeader('Cache-Control', 'no-store');

  const appId = env('ALGOLIA_APP_ID');
  const searchKey = env('ALGOLIA_SEARCH_KEY');
  const prefix = env('ALGOLIA_INDEX_PREFIX');
  if (!appId || !searchKey) {
    return res.status(501).json({ ok: false, configured: false, error: 'Algolia search is not set up on the server.' });
  }

  try {
    await requireTeamMember(req, 'Only Box Theory team members can search.');
    const validUntil = Math.floor(Date.now() / 1000) + VALID_SECONDS;
    const key = algoliasearch(appId, searchKey).generateSecuredApiKey({
      parentApiKey: searchKey,
      restrictions: { restrictIndices: INDICES.map((name) => `${prefix}${name}`), validUntil },
    });
    return res.status(200).json({ ok: true, appId, key, prefix, validUntil });
  } catch (error) {
    if (error instanceof HttpError) return res.status(error.status).json({ ok: false, error: error.message });
    console.error('[algolia-key]', error);
    return res.status(500).json({ ok: false, error: 'Could not prepare search. Please try again.' });
  }
}
