import { Link } from 'react-router-dom';
import { Check, ChevronRight, Image, MessageSquare, Repeat } from 'lucide-react';
import { cn, relativeTime } from '../../utils/formatters.js';

const TYPE_STYLES = {
  stage: { icon: ChevronRight, className: 'bg-blue-50 text-blue-700' },
  media: { icon: Image, className: 'bg-brand-soft text-brand-ink' },
  converted: { icon: Repeat, className: 'bg-green-50 text-green-700' },
  comment: { icon: MessageSquare, className: 'bg-violet-50 text-violet-700' },
  done: { icon: Check, className: 'bg-green-50 text-green-700' },
};

/** items: [{ id, type, actorName, text, jobId, detail, minutesAgo }] */
export default function RecentActivity({ items }) {
  return (
    <ol className="flex flex-col">
      {items.map((item, index) => {
        const { icon: Icon, className } = TYPE_STYLES[item.type] ?? TYPE_STYLES.stage;
        const isLast = index === items.length - 1;
        return (
          <li key={item.id} className={cn('relative flex gap-3', !isLast && 'pb-4.5')}>
            {!isLast && <span className="absolute bottom-1 left-[15px] top-9 w-0.5 bg-line" aria-hidden="true" />}
            <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', className)}>
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-[13px] leading-snug">
                <b>{item.actorName}</b> {item.text}{' '}
                <Link to={`/jobs/${item.jobId}`} className="font-semibold text-brand-ink hover:underline">
                  {item.jobId}
                </Link>{' '}
                {item.detail}
              </p>
              <p className="text-xs text-muted">{relativeTime(item.minutesAgo)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
