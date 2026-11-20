import { Link } from 'react-router-dom';
import { Check, ChevronRight, MessageSquare, Pencil, Plus, RefreshCw } from 'lucide-react';
import EmptyState from '../common/EmptyState.jsx';
import { cn, timeAgo } from '../../utils/formatters.js';

const TYPE_STYLES = {
  created: { icon: Plus, className: 'bg-brand-soft text-brand-ink' },
  status: { icon: RefreshCw, className: 'bg-amber-50 text-amber-700' },
  comment: { icon: MessageSquare, className: 'bg-violet-50 text-violet-700' },
  done: { icon: Check, className: 'bg-green-50 text-green-700' },
  edit: { icon: Pencil, className: 'bg-slate-100 text-slate-600' },
  stage: { icon: ChevronRight, className: 'bg-blue-50 text-blue-700' },
};

/** items: [{ id, type, text, byName, at, projectId, projectName }] — newest first. */
export default function RecentActivity({ items }) {
  if (!items.length) return <EmptyState title="No activity yet" description="Project updates, status changes and comments will appear here." />;
  return (
    <ol className="flex flex-col">
      {items.map((item, index) => {
        const { icon: Icon, className } = TYPE_STYLES[item.type] ?? TYPE_STYLES.stage;
        const isLast = index === items.length - 1;
        return (
          <li key={`${item.projectId}-${item.id}`} className={cn('relative flex gap-3', !isLast && 'pb-4.5')}>
            {!isLast && <span className="absolute bottom-1 left-[15px] top-9 w-0.5 bg-line" aria-hidden="true" />}
            <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', className)}>
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-[13px] leading-snug">
                {item.text} ·{' '}
                <Link to={`/projects/${item.projectId}`} className="font-semibold text-brand-ink hover:underline">
                  {item.projectId}
                </Link>{' '}
                <span className="text-muted">{item.projectName}</span>
              </p>
              <p className="text-xs text-muted">
                {item.byName || 'Someone'} · {timeAgo(item.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
