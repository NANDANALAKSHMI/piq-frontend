import { Search, X } from 'lucide-react';
import { cn } from '../../utils/formatters.js';

export default function SearchInput({ value, onChange, placeholder = 'Search', label, className, inputRef, onKeyDown }) {
  return (
    <label className={cn('flex h-10 min-w-0 items-center gap-2 rounded-[10px] border border-line bg-white px-3 text-muted focus-within:border-brand', className)}>
      <span className="sr-only">{label ?? placeholder}</span>
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="rounded p-0.5 hover:bg-slate-100" aria-label="Clear search">
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </label>
  );
}
