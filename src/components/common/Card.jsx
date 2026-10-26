import { cn } from '../../utils/formatters.js';

export default function Card({ as: Component = 'section', className, padded = true, children, ...props }) {
  return (
    <Component className={cn('min-w-0 rounded-2xl border border-line bg-white', padded && 'p-5', className)} {...props}>
      {children}
    </Component>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
