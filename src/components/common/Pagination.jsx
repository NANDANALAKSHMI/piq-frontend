import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/formatters.js';

/** Page numbers with ellipses, e.g. 1 … 4 5 6 … 11 */
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push(`gap-${page}`);
    result.push(page);
  });
  return result;
}

export default function Pagination({ page, pageCount, totalItems, pageSize, onPageChange, className }) {
  if (totalItems === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <nav aria-label="Pagination" className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <p className="text-[13px] text-muted">
        Showing <span className="font-semibold text-ink">{from}–{to}</span> of {totalItems}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex h-9 items-center gap-1 rounded-[10px] border border-line bg-white px-2.5 text-[13px] font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        {pageList(page, pageCount).map((item) =>
          typeof item === 'string' ? (
            <span key={item} className="px-1 text-muted">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
              className={cn(
                'h-9 min-w-9 rounded-[10px] border px-2 text-[13px] font-semibold transition-colors',
                item === page ? 'border-navy bg-navy text-white' : 'border-line bg-white hover:bg-slate-50',
              )}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pageCount}
          className="flex h-9 items-center gap-1 rounded-[10px] border border-line bg-white px-2.5 text-[13px] font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
