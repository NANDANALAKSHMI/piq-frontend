import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Pagination from './Pagination.jsx';
import usePagination from '../../hooks/usePagination.js';
import { cn } from '../../utils/formatters.js';

function compare(a, b) {
  if (a === b) return 0;
  if (a === undefined || a === null) return 1;
  if (b === undefined || b === null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

/**
 * Generic table with sortable headers, optional pagination, loading skeleton and empty state.
 * columns: [{ key, header, render?(row), sortValue?(row), sortable?, className?, headerClassName? }]
 */
export default function DataTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  pageSize,
  loading = false,
  emptyState,
  minWidth = 760,
  initialSort,
  rowClassName,
  className,
}) {
  const [sort, setSort] = useState(initialSort ?? null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return rows;
    const getValue = column.sortValue ?? ((row) => row[column.key]);
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => compare(getValue(a), getValue(b)) * direction);
  }, [rows, sort, columns]);

  const pagination = usePagination(sortedRows, pageSize ?? Math.max(sortedRows.length, 1));
  const visibleRows = pageSize ? pagination.pageItems : sortedRows;

  const toggleSort = (key) => {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  return (
    <div className={className}>
      <div className="scrollbar-thin relative overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth }}>
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sort?.key === column.key;
                const SortIcon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn(
                      'whitespace-nowrap border-b border-line bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold text-muted first:rounded-l-lg last:rounded-r-lg',
                      column.headerClassName,
                    )}
                  >
                    {column.sortable ? (
                      <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1 hover:text-ink">
                        {column.header}
                        <SortIcon className={cn('size-3.5', active ? 'text-ink' : 'opacity-50')} aria-hidden="true" />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: Math.min(pageSize ?? 5, 6) }, (_, index) => (
                <tr key={`skeleton-${index}`}>
                  {columns.map((column) => (
                    <td key={column.key} className="border-b border-line px-3 py-4">
                      <div className="h-3.5 w-full max-w-28 animate-pulse rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              visibleRows.map((row) => (
                <tr key={rowKey(row)} className={cn('transition-colors hover:bg-slate-50/70', rowClassName?.(row))}>
                  {columns.map((column) => (
                    <td key={column.key} className={cn('whitespace-nowrap border-b border-line px-3 py-3 align-middle', column.className)}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 && <div className="pt-4">{emptyState}</div>}
      {!loading && pageSize && rows.length > 0 && (
        <Pagination
          className="mt-4"
          page={pagination.page}
          pageCount={pagination.pageCount}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          onPageChange={pagination.setPage}
        />
      )}
    </div>
  );
}

/** Two-line cell: bold primary text with muted secondary text. */
export function CellStack({ primary, secondary }) {
  return (
    <div className="min-w-0">
      <div className="font-semibold">{primary}</div>
      {secondary && <div className="text-[12.5px] text-muted">{secondary}</div>}
    </div>
  );
}
