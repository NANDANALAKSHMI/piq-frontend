import { HttpError } from './_lib/firebaseToken.js';
import { clean, readBody, requireAdmin } from './_lib/auth.js';
import { algoliaConfig, searchIds } from './_lib/algolia.js';

/**
 * POST /api/search  { entity: 'projects' | 'clients' | 'enquiries' | 'vendors' | 'members', query }
 * → { ok: true, ids: [...] }   best match first, typo tolerant (Algolia).
 * → 501 { ok: false, configured: false }   when Algolia isn't set up; the app then searches locally.
 * Only signed-in Box Theory people can call it; the Algolia keys never reach the browser.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Use POST.' });
  }
  try {
    if (!algoliaConfig().configured) return res.status(501).json({ ok: false, configured: false, error: 'Algolia search is not set up.' });
    await requireAdmin(req, 'search');
    const { entity, query } = readBody(req);
    const ids = await searchIds(clean(entity, 20), clean(query, 200));
    return res.status(200).json({ ok: true, ids });
  } catch (error) {
    if (error instanceof HttpError) return res.status(error.status).json({ ok: false, error: error.message });
    console.error('[search]', error);
    return res.status(500).json({ ok: false, error: 'Search failed. Please try again.' });
  }
}
