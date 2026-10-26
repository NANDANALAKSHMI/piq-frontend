import { Check } from 'lucide-react';
import { cn } from '../../utils/formatters.js';

/** Horizontal stage tracker. `current` is the index of the active stage (= length when finished). */
export default function WorkflowStepper({ stages, current, status }) {
  return (
    <ol className="scrollbar-thin flex overflow-x-auto py-1">
      {stages.map((stage, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={stage.id ?? stage.name} className="relative flex min-w-[112px] flex-1 flex-col items-center gap-1.5 text-center">
            {index > 0 && (
              <span
                className={cn('absolute right-1/2 top-4 h-[3px] w-full', done || active ? 'bg-green-600' : 'bg-line')}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'relative z-10 grid size-8.5 place-items-center rounded-full border-2 text-[13px] font-bold',
                done && 'border-green-700 bg-green-700 text-white',
                active && 'border-brand bg-brand text-navy ring-[5px] ring-brand-soft',
                !done && !active && 'border-slate-300 bg-white text-muted',
              )}
            >
              {done ? <Check className="size-4" aria-label="Done" /> : index + 1}
            </span>
            <span className="text-[13px] font-semibold">{stage.name}</span>
            <span className={cn('text-xs', active ? 'font-semibold text-brand-ink' : 'text-muted')}>
              {done ? 'Done' : active ? (status === 'On hold' ? 'On hold' : status === 'Upcoming' ? 'Next up' : 'In progress') : `${stage.days} day${stage.days === 1 ? '' : 's'}`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
