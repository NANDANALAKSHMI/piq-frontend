import { useEffect, useRef } from 'react';
import { isSearchAvailable, syncRecords } from '../lib/searchApi.js';
import { clientRecord, enquiryRecord, memberRecord, projectRecord, vendorRecord } from '../lib/searchRecords.js';

const STORE_KEY = 'piq-search-index-v1';
const BATCH = 400;
const DELAY_MS = 1500;

function loadStored() {
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveStored(entity, signatures) {
  try {
    const all = loadStored();
    all[entity] = signatures;
    window.localStorage.setItem(STORE_KEY, JSON.stringify(all));
  } catch {
    /* storage full or blocked — the next change simply re-sends everything */
  }
}

/**
 * Keeps the Algolia index in step with Firestore. Whenever a list changes it sends only the
 * records that are new or edited (and removes deleted ones), after a short pause. What was last
 * sent is remembered in this browser, so the first sign-in builds the index and later visits send
 * almost nothing. If Algolia isn't set up on the server, it quietly does nothing.
 */
function useEntitySync(entity, rows, ready, enabled, toRecord) {
  const timer = useRef(null);

  useEffect(() => {
    if (!enabled || !ready || !isSearchAvailable()) return undefined;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const current = new Map(rows.map((row) => [row.id, toRecord(row)]));
      const stored = loadStored()[entity] ?? {};
      const signatures = {};
      const upserts = [];
      for (const [id, record] of current) {
        const signature = JSON.stringify(record);
        signatures[id] = signature;
        if (stored[id] !== signature) upserts.push(record);
      }
      const deletes = Object.keys(stored).filter((id) => !current.has(id));
      if (!upserts.length && !deletes.length) return;

      const done = { ...stored };
      try {
        for (let i = 0; i < Math.max(upserts.length, deletes.length); i += BATCH) {
          const up = upserts.slice(i, i + BATCH);
          const del = deletes.slice(i, i + BATCH);
          if (!(await syncRecords(entity, up, del))) return; // not set up here — stop quietly
          up.forEach((record) => {
            done[record.objectID] = signatures[record.objectID];
          });
          del.forEach((id) => delete done[id]);
          saveStored(entity, done);
        }
      } catch {
        /* a failed sync is retried the next time the list changes */
      }
    }, DELAY_MS);
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toRecord is stable per render of the caller
  }, [entity, rows, ready, enabled]);
}

/** Pass each list with whether it has finished loading (without an error). */
export default function useSearchIndexSync({ enabled, projects, clients, enquiries, vendors, members }) {
  useEntitySync('projects', projects.rows, projects.ready && clients.ready, enabled, (p) => projectRecord(p, clients.rows));
  useEntitySync('clients', clients.rows, clients.ready, enabled, clientRecord);
  useEntitySync('enquiries', enquiries.rows, enquiries.ready, enabled, enquiryRecord);
  useEntitySync('vendors', vendors.rows, vendors.ready, enabled, vendorRecord);
  useEntitySync('members', members.rows, members.ready, enabled, memberRecord);
}
