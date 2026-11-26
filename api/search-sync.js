import { HttpError } from './_lib/firebaseToken.js';
import { clean, readBody, requireAdmin } from './_lib/auth.js';
import { algoliaConfig, writeRecords } from './_lib/algolia.js';

const MAX_RECORDS = 500;

/** Keeps only short strings / numbers: the index holds searchable text, never whole documents. */
function toRecord(raw) {
  const objectID = clean(raw?.objectID, 100);
  if (!objectID) return null;
  const record = { objectID };
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'objectID' || !/^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(key)) continue;
    if (typeof value === 'number' && Number.isFinite(value)) record[key] = value;
    else if (typeof value === 'string') record[key] = value.slice(0, 2000);
    else if (Array.isArray(value)) record[key] = value.filter((item) => typeof item === 'string').slice(0, 50).map((item) => item.slice(0, 200));
  }
  return record;
}

/**
 * POST /api/search-sync  { entity, upserts: [{ objectID, ...fields }], deletes: [objectID] }
 * Keeps the Algolia index in step with Firestore. The app calls it automatically when records change.
 * → 501 { configured: false } when Algolia isn't set up (the app stops trying).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Use POST.' });
  }
  try {
    if (!algoliaConfig().configured) return res.status(501).json({ ok: false, configured: false, error: 'Algolia search is not set up.' });
    await requireAdmin(req, 'update the search index');
    const body = readBody(req);
    const upserts = (Array.isArray(body.upserts) ? body.upserts : []).slice(0, MAX_RECORDS).map(toRecord).filter(Boolean);
    const deletes = (Array.isArray(body.deletes) ? body.deletes : []).slice(0, MAX_RECORDS).map((id) => clean(id, 100)).filter(Boolean);
    await writeRecords(clean(body.entity, 20), upserts, deletes);
    return res.status(200).json({ ok: true, indexed: upserts.length, removed: deletes.length });
  } catch (error) {
    if (error instanceof HttpError) return res.status(error.status).json({ ok: false, error: error.message });
    console.error('[search-sync]', error);
    return res.status(500).json({ ok: false, error: 'Could not update the search index.' });
  }
}
