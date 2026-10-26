import { useState } from 'react';

/**
 * Slices `items` into pages. When the item list shrinks (e.g. a filter is applied)
 * the page is clamped so the user never lands on an empty page.
 */
export default function usePagination(items, pageSize = 8) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return {
    page: currentPage,
    pageCount,
    pageItems,
    pageSize,
    totalItems: items.length,
    setPage: (next) => setPage(Math.max(1, Math.min(next, pageCount))),
    resetPage: () => setPage(1),
  };
}
