import { useRef } from 'react';
import { FileText, Image, PlayCircle, Upload } from 'lucide-react';
import { cn } from '../../utils/formatters.js';

const TYPE_ICONS = { image: Image, video: PlayCircle, document: FileText };

/** Media grid with a working file picker (files are kept in memory only). */
export default function MediaGallery({ media, onUpload, getMember, compact = false }) {
  const inputRef = useRef(null);
  const items = compact ? media.slice(0, 5) : media;

  return (
    <div className={cn('grid gap-2.5', compact ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4')}>
      {items.map((item) => {
        const Icon = TYPE_ICONS[item.type];
        return (
          <figure
            key={item.id}
            className={cn(
              'relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[10px] p-2',
              item.type === 'video' ? 'bg-navy-2 text-white' : 'bg-[#e9edf3] text-slate-700',
            )}
          >
            <Icon className={cn('absolute inset-0 m-auto size-8', item.type === 'video' ? 'text-white/80' : 'text-slate-400')} aria-hidden="true" />
            <figcaption className="relative truncate text-[11.5px] font-medium">{item.title}</figcaption>
            {!compact && (
              <span className={cn('relative truncate text-[10.5px]', item.type === 'video' ? 'text-white/70' : 'text-muted')}>
                {getMember(item.uploadedBy)?.name ?? 'You'} · {item.when}
              </span>
            )}
          </figure>
        );
      })}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-dashed border-slate-300 bg-white text-[12.5px] font-medium text-muted transition-colors hover:border-brand hover:text-brand-ink"
      >
        <Upload className="size-5" aria-hidden="true" />
        Upload
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) onUpload(files);
          event.target.value = '';
        }}
      />
    </div>
  );
}
