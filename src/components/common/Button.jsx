import { Link } from 'react-router-dom';
import { cn } from '../../utils/formatters.js';

const VARIANTS = {
  primary: 'bg-brand text-navy border-brand hover:bg-[#e47d18] hover:border-[#e47d18]',
  secondary: 'bg-white text-ink border-line hover:bg-slate-50 hover:border-slate-300',
  dark: 'bg-navy text-white border-navy hover:bg-navy-2',
  danger: 'bg-white text-red-700 border-red-200 hover:bg-red-50',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-slate-100',
};

const SIZES = {
  sm: 'h-9 px-3 text-[13px] gap-1.5',
  md: 'h-10.5 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2',
};

/**
 * Button that renders a <Link> when `to` is given, otherwise a <button>.
 * `icon` is a Lucide component shown before the label.
 */
export default function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  to,
  className,
  children,
  type = 'button',
  fullWidth = false,
  ...props
}) {
  const classes = cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-[10px] border font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  );
  const content = (
    <>
      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
      {children}
      {IconRight && <IconRight className="size-4 shrink-0" aria-hidden="true" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...props}>
      {content}
    </button>
  );
}

/** Square icon-only button; `label` is required for screen readers. */
export function IconButton({ icon: Icon, label, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'relative grid size-10.5 shrink-0 place-items-center rounded-[10px] border border-line bg-white text-ink transition-colors hover:bg-slate-50',
        className,
      )}
      {...props}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
      {children}
    </button>
  );
}
