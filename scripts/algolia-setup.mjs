/**
 * One-time Algolia index setup for PIQ: which fields are searchable and which can be filtered.
 * Run it after the Firebase "Search Firestore with Algolia" extension has created the indices,
 * and again whenever this file changes:
 *
 *   npm run algolia:setup
 *
 * Reads from .env.local (never commit the Admin key, and never prefix it with VITE_):
 *   ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY, ALGOLIA_INDEX_PREFIX (optional)
 */
import { algoliasearch } from 'algoliasearch';

const appId = process.env.ALGOLIA_APP_ID?.trim();
const adminKey = process.env.ALGOLIA_ADMIN_KEY?.trim();
const prefix = process.env.ALGOLIA_INDEX_PREFIX?.trim() ?? '';

if (!appId || !adminKey) {
  console.error('Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_KEY in .env.local.');
  process.exit(1);
}

const filterOnly = (attribute) => `filterOnly(${attribute})`;

/** Index name → settings. Field names match the Firestore documents. */
const SETTINGS = {
  projects: {
    searchableAttributes: ['code', 'name', 'clientName', 'city', 'serviceNames'],
    attributesForFaceting: ['status', filterOnly('city'), filterOnly('serviceIds'), filterOnly('teamIds')],
    numericAttributesForFiltering: ['dueTs'],
    customRanking: ['desc(code)'],
  },
  vendors: {
    searchableAttributes: ['name', 'contactPerson', 'phone', 'email', 'city', 'district', 'state'],
    attributesForFaceting: [filterOnly('state'), filterOnly('district'), filterOnly('city'), filterOnly('serviceIds'), filterOnly('status')],
    customRanking: ['asc(name)'],
  },
  enquiries: {
    searchableAttributes: ['code', 'company', 'contactName', 'phone', 'email', 'city'],
    attributesForFaceting: [filterOnly('status'), filterOnly('city')],
    customRanking: ['desc(code)'],
  },
  clients: {
    searchableAttributes: ['name', 'contactName', 'phone', 'email', 'locations.city', 'locations.district', 'locations.state', 'locations.address', 'locations.pin'],
    attributesForFaceting: [filterOnly('locations.city')],
    customRanking: ['asc(name)'],
  },
};

const client = algoliasearch(appId, adminKey);
for (const [name, indexSettings] of Object.entries(SETTINGS)) {
  const indexName = `${prefix}${name}`;
  const { taskID } = await client.setSettings({ indexName, indexSettings });
  await client.waitForTask({ indexName, taskID });
  console.log(`✓ ${indexName}`);
}
console.log('Algolia indices are ready.');
