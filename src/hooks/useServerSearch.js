import { useEffect, useMemo, useState } from 'react';
import { isSearchAvailable, searchIds } from '../lib/searchApi.js';

const DELAY_MS = 250;

/**
 * Server-side (Algolia) search for a list page.
 *   const { filter } = useServerSearch('vendors', query);
 *   const rows = filter(allRows, (row) => localMatch(row));
 * `filter` keeps only the rows Algolia matched, best match first. When search isn't set up (or the
 * request fails) it uses `localMatch` instead, so the page always works.
 */
export default function useServerSearch(entity, query) {
  const text = query.trim();
  const [result, setResult] = useState({ query: '', ids: null });

  useEffect(() => {
    if (!text || !isSearchAvailable()) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchIds(entity, text)
        .then((ids) => !cancelled && setResult({ query: text, ids }))
        .catch(() => !cancelled && setResult({ query: text, ids: null }));
    }, DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [entity, text]);

  // Until Algolia answers for this exact text, the page's own filter keeps results instant.
  const ids = text && result.query === text ? result.ids : null;

  const filter = useMemo(
    () => (rows, localMatch) => {
      if (!text) return rows;
      if (!ids) return rows.filter(localMatch);
      const rank = new Map(ids.map((id, index) => [id, index]));
      return rows.filter((row) => rank.has(row.id)).sort((a, b) => rank.get(a.id) - rank.get(b.id));
    },
    [text, ids],
  );

  return { filter, serverSearch: ids !== null };
}
