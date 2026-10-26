import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/formatters.js';

const ICON_TONES = {
  blue: 'bg-blue-50 text-blue-700',
  orange: 'bg-brand-soft text-brand-ink',
  sky: 'bg-sky-50 text-sky-700',
  green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-700',
  violet: 'bg-violet-50 text-violet-700',
};

/** trend: 'up' | 'down' | undefined — colours the helper line. */
export default function StatCard({ label, value, helper, icon: Icon, tone = 'blue', trend, valueClassName }) {
  const TrendIcon = trend === 'down' ? TrendingDown : TrendingUp;
  return (
    <div className="flex min-w-0 items-center gap-3.5 rounded-2xl border border-line bg-white p-3.5 transition-shadow hover:shadow-sm sm:p-4.5">
      {Icon && (
        <span className={cn('hidden size-11.5 shrink-0 place-items-center rounded-xl sm:grid', ICON_TONES[tone])}>
          <Icon className="size-[22px]" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[13px] text-muted">{label}</p>
        <p className={cn('text-[26px] font-bold leading-tight tracking-tight', valueClassName)}>{value}</p>
        {helper && (
          <p
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend === 'up' && 'text-green-700',
              trend === 'down' && 'text-red-700',
              !trend && 'text-muted',
            )}
          >
            {trend && <TrendIcon className="size-3.5" aria-hidden="true" />}
            {helper}
          </p>
        )}
      </div>
    </div>
  );
}
