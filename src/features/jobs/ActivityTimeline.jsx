import { Check, ChevronRight, FileText, MessageSquare, Plus, RefreshCw } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState.jsx';
import { cn } from '../../utils/formatters.js';

const TYPE_STYLES = {
  stage: { icon: ChevronRight, className: 'bg-blue-50 text-blue-700' },
  done: { icon: Check, className: 'bg-green-50 text-green-700' },
  media: { icon: FileText, className: 'bg-violet-50 text-violet-700' },
  comment: { icon: MessageSquare, className: 'bg-violet-50 text-violet-700' },
  status: { icon: RefreshCw, className: 'bg-amber-50 text-amber-700' },
  created: { icon: Plus, className: 'bg-brand-soft text-brand-ink' },
};

export default function ActivityTimeline({ items, getMember, limit }) {
  const visible = limit ? items.slice(0, limit) : items;
  if (!visible.length) return <EmptyState title="No activity yet" description="Stage changes, uploads and comments will appear here." />;

  return (
    <ol className="flex flex-col">
      {visible.map((item, index) => {
        const { icon: Icon, className } = TYPE_STYLES[item.type] ?? TYPE_STYLES.stage;
        const isLast = index === visible.length - 1;
        return (
          <li key={item.id} className={cn('relative flex gap-3', !isLast && 'pb-4.5')}>
            {!isLast && <span className="absolute bottom-1 left-[15px] top-9 w-0.5 bg-line" aria-hidden="true" />}
            <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', className)}>
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <div className="pt-1">
              <p className="text-[13px] font-medium">{item.text}</p>
              <p className="text-xs text-muted">
                {item.when} · {getMember(item.by)?.name ?? 'System'}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
